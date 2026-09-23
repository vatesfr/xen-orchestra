//! The `serve` run: log in, open the disk, serve NBD, tear down.
//!
//! Standard output is the NBD stream; nothing else is ever written to it.
//! Diagnostics go to standard error. Two threads run the transmission: one
//! parses requests from the input and parks them in a bounded channel, the
//! other owns the host connection and the output, keeps up to the depth of
//! host reads in flight and answers each command as its last read lands.

use std::collections::VecDeque;
use std::io::{BufReader, Read, Write};
use std::num::NonZeroUsize;
use std::sync::mpsc::{self, Receiver, TryRecvError};
use std::thread;
use std::time::Instant;

use crate::soap::{self, Password, Session};
use crate::transcript::{PROGRESS_STEP, Transcript};
use crate::{disk, nbd, nfc, tls};

/// How many batches of parsed requests the reader parks ahead of the host loop.
///
/// One: the host loop issues the reads of a batch together before it blocks
/// on the socket, and the reader blocks on the channel beyond that, so a
/// client cannot make the process buffer its backlog.
const PARKED_BATCHES: usize = 1;

/// The most host reads one process keeps in flight: the ceiling of `--depth`.
///
/// An ESXi host grants about 48 MB of NFC buffers, 1 MB per I/O stream,
/// shared by every reader; 32 from one process stays under that with room
/// for the host's own use. The limit is per host, which the help text says,
/// so several processes on one host are given a lower depth.
pub const MAX_DEPTH: usize = 32;

/// The most requests one batch holds, which is what the reader's buffer holds.
///
/// As many as the deepest window keeps reads in flight, so a client sending
/// one request per read in flight has them parsed and issued together.
const BATCH: usize = MAX_DEPTH;

/// Requests parsed together; only the last can be an error or `NBD_CMD_DISC`.
type Batch = Vec<Result<nbd::Request, nbd::Error>>;

/// A chunk received: its read's index among those in flight, the chunk, its bytes.
type Answer = (usize, disk::Chunk, Vec<u8>);

/// What to serve and how to reach it.
#[derive(Debug)]
pub struct Target {
    /// The host name or address.
    pub host: String,
    /// The management port.
    pub port: u16,
    /// How the management port's certificate is judged.
    pub trust: tls::Trust,
    /// The user name to log in with.
    pub user: String,
    /// The managed object reference of the virtual machine.
    pub vm_id: String,
    /// The datastore path of the disk, in `[datastore] dir/name.vmdk` form.
    pub disk: String,
    /// How many host reads to keep in flight at once, across every command.
    pub depth: NonZeroUsize,
    /// How the host is asked to send each chunk.
    pub compression: disk::Compression,
    /// How the disk session runs after the ticket dialogue.
    pub transport: nfc::Transport,
    /// Where the session is narrated, if anywhere.
    pub transcript: Transcript,
}

/// Failures of a run, each naming the plane it happened on.
#[derive(Debug, thiserror::Error)]
pub enum Error {
    /// A management-plane call failed.
    #[error("management plane: {0}")]
    Management(#[from] soap::Error),
    /// The data plane failed before or after the disk was open.
    #[error("data plane: {0}")]
    Data(#[from] nfc::Error),
    /// A chunk the host sent does not fit the read it answers.
    #[error("data plane: {0}")]
    Chunk(#[from] disk::Error),
    /// A chunk was matched to a read the window does not hold.
    #[error("data plane: a chunk was matched to read {index} of {in_flight} in flight")]
    Stray {
        /// The index the chunk was matched to.
        index: usize,
        /// How many reads were in flight.
        in_flight: usize,
    },
    /// The NBD client broke the protocol or left.
    #[error(transparent)]
    Nbd(#[from] nbd::Error),
}

/// Logs in, serves the disk over NBD on `input` and `output`, and logs out.
///
/// `Logout` runs whatever happened after the login; its failure is reported
/// on standard error and does not change the outcome.
///
/// # Errors
/// When any plane fails; the message names the plane and the phase.
pub fn run<R: Read + Send + 'static, W: Write>(
    target: &Target,
    password: &Password,
    input: R,
    output: &mut W,
) -> Result<(), Error> {
    let session = Session::login(
        &target.host,
        target.port,
        &target.trust,
        &target.user,
        password,
        target.transcript,
    )?;
    let outcome = export(&session, target, input, output);
    if let Err(error) = session.logout() {
        eprintln!("vectura: logout: {error}");
    }
    outcome
}

/// Opens the disk, serves it until the client disconnects, closes it.
///
/// After a data-plane failure the connection is mid-record, so it is dropped
/// without a close or an end; the host frees the disk when the socket goes.
fn export<R: Read + Send + 'static, W: Write>(
    session: &Session,
    target: &Target,
    input: R,
    output: &mut W,
) -> Result<(), Error> {
    let ticket = session.ticket(&target.vm_id)?;
    let mut connection = nfc::Connection::establish(
        &target.host,
        ticket.port,
        &ticket.secret,
        &ticket.thumbprint,
        target.transport,
        target.transcript,
    )?;
    let disk = match connection.open(&target.disk) {
        Ok(disk) => disk,
        Err(error) => {
            // Nothing to close, but the session is ended so the host frees it.
            if let Err(end) = connection.end() {
                eprintln!("vectura: end: {end}");
            }
            return Err(Error::Data(error));
        }
    };
    let outcome = transmit(
        input,
        output,
        disk,
        target.depth,
        target.compression,
        target.transcript,
        &mut connection,
    );
    if !matches!(outcome, Ok(()) | Err(Error::Nbd(_))) {
        return outcome;
    }
    let teardown = connection
        .close(disk.handle)
        .and_then(|()| connection.end())
        .map_err(Error::from);
    outcome.and(teardown)
}

/// A host that answers reads issued ahead of their chunks, in any order.
///
/// [`nfc::Connection`] is the host; the tests stand in one.
trait Host {
    /// What a read is known by once issued.
    type Pending: Copy;

    /// Asks for `length` bytes at `offset` of the disk `handle` names, sent as `compression` says.
    fn issue(
        &mut self,
        handle: u64,
        offset: u64,
        length: u32,
        compression: disk::Compression,
    ) -> Result<Self::Pending, Error>;

    /// Waits for a chunk answering one of the reads `in_flight`.
    fn receive(&mut self, in_flight: &[Self::Pending]) -> Result<Answer, Error>;
}

impl Host for nfc::Connection {
    type Pending = nfc::Pending;

    fn issue(
        &mut self,
        handle: u64,
        offset: u64,
        length: u32,
        compression: disk::Compression,
    ) -> Result<nfc::Pending, Error> {
        Ok(self.read(handle, offset, length, compression.code())?)
    }

    fn receive(&mut self, in_flight: &[nfc::Pending]) -> Result<Answer, Error> {
        let (index, reply, data) = self.chunk(in_flight)?;
        let chunk = disk::Chunk {
            base_offset: reply.base_offset,
            total_length: reply.total_length,
            offset: reply.chunk_offset,
            length: reply.chunk_length,
            compression: reply.compression,
        };
        Ok((index, chunk, data))
    }
}

/// One host read of a command: queued until issued, in flight until complete.
struct HostRead<P> {
    read: disk::Read,
    /// What the host knows the read by, once issued.
    pending: Option<P>,
}

impl<P: Copy> HostRead<P> {
    /// The read as issued, while it is in flight.
    fn in_flight(&self) -> Option<P> {
        self.pending.filter(|_| !self.read.is_complete())
    }
}

/// One `NBD_CMD_READ` being answered through its host reads, in disk order.
struct Command<P> {
    cookie: u64,
    offset: u64,
    length: u32,
    reads: Vec<HostRead<P>>,
    /// The reply as built: a success header, then the bytes as they land.
    reply: Vec<u8>,
}

impl<P: Copy> Command<P> {
    /// The command for `request`, which the export of `capacity` bytes accepted.
    fn new(request: &nbd::Request, capacity: u64) -> Command<P> {
        let mut reply = nbd::simple_reply(request.cookie, 0).to_vec();
        // At most `nbd::MAX_PAYLOAD` bytes, since the refusal passed.
        let length = usize::try_from(request.length).unwrap_or(usize::MAX);
        reply.resize(nbd::SIMPLE_REPLY_LEN + length, 0);
        Command {
            cookie: request.cookie,
            offset: request.offset,
            length: request.length,
            reads: disk::reads(request.offset, request.length, capacity)
                .into_iter()
                .map(|read| HostRead {
                    read,
                    pending: None,
                })
                .collect(),
            reply,
        }
    }

    fn is_done(&self) -> bool {
        self.reads.iter().all(|read| read.read.is_complete())
    }

    /// Accepts `chunk` for the read at `index`, decodes it and places its bytes.
    ///
    /// The sector padding around the range falls outside and is dropped.
    fn place(&mut self, index: usize, chunk: &disk::Chunk, wire: &[u8]) -> Result<(), Error> {
        let read = &mut self.reads[index].read;
        read.accept(chunk)?;
        let data = chunk.decode(wire)?;
        place(
            self.offset,
            &mut self.reply[nbd::SIMPLE_REPLY_LEN..],
            read.offset + u64::from(chunk.offset),
            &data,
        );
        Ok(())
    }
}

/// What a transmission has served so far, for the progress and summary lines.
#[derive(Debug, Default)]
struct Tally {
    /// Bytes answered to the client.
    served: u64,
    /// Bytes of chunk payload as the host sent them.
    wire: u64,
    /// Bytes those chunks decode to.
    logical: u64,
    /// Host reads issued.
    reads: u64,
}

impl Tally {
    /// Counts `bytes` answered; true when that crossed a [`PROGRESS_STEP`] boundary.
    fn served(&mut self, bytes: u64) -> bool {
        let before = self.served / PROGRESS_STEP;
        self.served += bytes;
        self.served / PROGRESS_STEP > before
    }
}

/// The commands being answered and the depth of host reads serving them.
struct Window<'a, H: Host> {
    host: &'a mut H,
    handle: u64,
    capacity: u64,
    depth: NonZeroUsize,
    /// How every host read asks for its chunks.
    compression: disk::Compression,
    /// In the order received; a command leaves once its reply is written.
    commands: Vec<Command<H::Pending>>,
    transcript: Transcript,
    tally: Tally,
}

impl<H: Host> Window<'_, H> {
    /// The reads in flight, in the order issued.
    fn in_flight(&self) -> impl Iterator<Item = H::Pending> + '_ {
        self.commands
            .iter()
            .flat_map(|command| command.reads.iter().filter_map(HostRead::in_flight))
    }

    fn is_full(&self) -> bool {
        self.in_flight().count() >= self.depth.get()
    }

    fn is_idle(&self) -> bool {
        self.commands.is_empty()
    }

    /// Answers `request` at once if refused or empty; else takes it as a command.
    fn take<W: Write>(&mut self, request: &nbd::Request, output: &mut W) -> Result<(), Error> {
        if let Some(error) = nbd::refusal(request, self.capacity) {
            return Ok(nbd::send(
                output,
                &nbd::simple_reply(request.cookie, error),
            )?);
        }
        let command = Command::new(request, self.capacity);
        if command.is_done() {
            return Ok(nbd::send(output, &command.reply)?);
        }
        self.commands.push(command);
        Ok(())
    }

    /// Issues queued reads, in command order, until the depth is reached.
    fn issue(&mut self) -> Result<(), Error> {
        let mut in_flight = self.in_flight().count();
        for read in self
            .commands
            .iter_mut()
            .flat_map(|command| command.reads.iter_mut())
        {
            if in_flight >= self.depth.get() {
                break;
            }
            if read.pending.is_none() {
                let (offset, length) = (read.read.offset, read.read.length);
                let pending = self
                    .host
                    .issue(self.handle, offset, length, self.compression)?;
                read.pending = Some(pending);
                self.tally.reads += 1;
                in_flight += 1;
            }
        }
        Ok(())
    }

    /// Waits for the next chunk of any read in flight.
    fn receive(&mut self) -> Result<Answer, Error> {
        let in_flight = self.in_flight().collect::<Vec<_>>();
        self.host.receive(&in_flight)
    }

    /// Places a chunk and writes the reply of the command it completes.
    ///
    /// Without `output` the reply is dropped: the client is gone or done.
    fn settle<W: Write>(
        &mut self,
        (index, chunk, data): Answer,
        mut output: Option<&mut W>,
    ) -> Result<(), Error> {
        let Some((command, read)) = self
            .commands
            .iter()
            .enumerate()
            .flat_map(|(command, reads)| {
                reads
                    .reads
                    .iter()
                    .enumerate()
                    .filter(|(_, read)| read.in_flight().is_some())
                    .map(move |(read, _)| (command, read))
            })
            .nth(index)
        else {
            return Err(Error::Stray {
                index,
                in_flight: self.in_flight().count(),
            });
        };
        self.tally.logical += u64::from(chunk.length);
        self.tally.wire += u64::try_from(data.len()).unwrap_or(u64::MAX);
        self.commands[command].place(read, &chunk, &data)?;
        for command in self.commands.extract_if(.., |command| command.is_done()) {
            if let Some(output) = output.as_deref_mut() {
                nbd::send(output, &command.reply)?;
                if self.tally.served(u64::from(command.length)) {
                    self.transcript.progress(
                        self.tally.served,
                        self.tally.wire,
                        self.tally.logical,
                        self.depth.get(),
                    );
                }
            }
        }
        Ok(())
    }

    /// Finishes the reads in flight, and the queued ones while the client is there.
    ///
    /// Commands are answered as they complete. A write that fails drops the
    /// replies after it and is reported once the reads in flight are
    /// finished, so the connection is left on a record boundary. A host read
    /// that fails ends it at once, every open command answered `NBD_EIO`
    /// while the client is still there.
    fn finish<W: Write>(&mut self, mut output: Option<&mut W>) -> Result<(), Error> {
        let mut outcome = Ok(());
        loop {
            let issued = match output {
                Some(_) => self.issue(),
                None => Ok(()),
            };
            let advanced = issued.and_then(|()| {
                if self.in_flight().next().is_none() {
                    return Ok(false);
                }
                let answer = self.receive()?;
                self.settle(answer, output.as_deref_mut())?;
                Ok(true)
            });
            match advanced {
                Ok(true) => {}
                Ok(false) => return outcome,
                Err(error @ Error::Nbd(_)) => {
                    outcome = Err(error);
                    output = None;
                }
                Err(error) => {
                    if let Some(output) = output {
                        self.abandon(output);
                    }
                    return Err(error);
                }
            }
        }
    }

    /// Answers `NBD_EIO` to every command still open, until a write fails.
    fn abandon<W: Write>(&mut self, output: &mut W) {
        for command in self.commands.drain(..) {
            if nbd::send(output, &nbd::simple_reply(command.cookie, nbd::EIO)).is_err() {
                return;
            }
        }
    }
}

/// Copies the bytes of `data`, at disk offset `at`, that fall in `window`.
///
/// `window` starts at disk offset `window_offset`; bytes of `data` outside
/// it, such as the sector padding around a client's range, are dropped.
fn place(window_offset: u64, window: &mut [u8], at: u64, data: &[u8]) {
    let Ok(skip) = usize::try_from(window_offset.saturating_sub(at)) else {
        return;
    };
    let Ok(start) = usize::try_from(at.saturating_sub(window_offset)) else {
        return;
    };
    if skip >= data.len() || start >= window.len() {
        return;
    }
    let length = (data.len() - skip).min(window.len() - start);
    window[start..start + length].copy_from_slice(&data[skip..skip + length]);
}

/// Parses requests from `input` on a thread and parks them in batches.
///
/// A batch is every request the buffer holds when the reader would next
/// block; it ends at `NBD_CMD_DISC` or an error. The thread is not joined,
/// since a reader blocked on standard input cannot be stopped: it ends with
/// the last batch, when the client leaves, or with the process.
fn read_requests<R: Read + Send + 'static>(input: R) -> Receiver<Batch> {
    let (parked, requests) = mpsc::sync_channel(PARKED_BATCHES);
    thread::spawn(move || {
        let mut input = BufReader::with_capacity(BATCH * nbd::REQUEST_LEN, input);
        let mut batch = Batch::new();
        loop {
            let request = nbd::next_request(&mut input);
            let last = matches!(
                &request,
                Err(_)
                    | Ok(nbd::Request {
                        kind: nbd::CMD_DISC,
                        ..
                    })
            );
            batch.push(request);
            if !last && input.buffer().len() >= nbd::REQUEST_LEN {
                continue;
            }
            if parked.send(std::mem::take(&mut batch)).is_err() || last {
                return;
            }
        }
    });
    requests
}

/// Negotiates the export, then serves requests until `NBD_CMD_DISC`.
///
/// A client that aborts the negotiation ends the run cleanly. Otherwise the
/// requests are parsed by [`read_requests`] and served through a [`Window`]
/// of `depth` host reads on `host`. At `NBD_CMD_DISC` the reads in flight are
/// finished and their commands answered. When the client leaves or stops
/// reading, the reads in flight are finished, their replies dropped, and the
/// failure returned. When a host read fails, every command in flight is
/// answered `NBD_EIO` and the run ends with the failure.
fn transmit<R, W, H>(
    mut input: R,
    output: &mut W,
    disk: nfc::Disk,
    depth: NonZeroUsize,
    compression: disk::Compression,
    transcript: Transcript,
    host: &mut H,
) -> Result<(), Error>
where
    R: Read + Send + 'static,
    W: Write,
    H: Host,
{
    let started = Instant::now();
    match nbd::negotiate(&mut input, output, disk.capacity, transcript)? {
        nbd::Negotiated::Abort => return Ok(()),
        nbd::Negotiated::Export => {}
    }
    let requests = read_requests(input);
    let mut window = Window {
        host,
        handle: disk.handle,
        capacity: disk.capacity,
        depth,
        compression,
        commands: Vec::new(),
        transcript,
        tally: Tally::default(),
    };
    let outcome = match serve(&mut window, &requests, output) {
        Ok(()) => window.finish(Some(output)),
        Err(error @ Error::Nbd(_)) => window.finish::<W>(None).and(Err(error)),
        Err(error) => {
            window.abandon(output);
            Err(error)
        }
    };
    transcript.summary(
        window.tally.served,
        window.tally.wire,
        window.tally.reads,
        started.elapsed(),
    );
    outcome
}

/// Serves requests until `NBD_CMD_DISC`, keeping the window as full as it can.
///
/// While a read is in flight the channel is only polled and the thread
/// blocks on the host socket, so a chunk is placed as soon as it lands and
/// the next read goes out at once; it blocks on the channel only while no
/// read is in flight. A request is taken only while the window has room, so
/// a client cannot make the process hold the buffers of a backlog.
fn serve<H: Host, W: Write>(
    window: &mut Window<'_, H>,
    requests: &Receiver<Batch>,
    output: &mut W,
) -> Result<(), Error> {
    let mut queue = VecDeque::new();
    loop {
        window.issue()?;
        let room = !window.is_full();
        if room && queue.is_empty() {
            let batch = if window.is_idle() {
                requests.recv().ok()
            } else {
                match requests.try_recv() {
                    Ok(batch) => Some(batch),
                    // Nothing parsed yet: a chunk is placed meanwhile.
                    Err(TryRecvError::Empty) => Some(Batch::new()),
                    Err(TryRecvError::Disconnected) => None,
                }
            };
            queue.extend(batch.ok_or(nbd::Error::Left)?);
        }
        let next = if room { queue.pop_front() } else { None };
        match next {
            Some(Ok(request)) if request.kind == nbd::CMD_DISC => return Ok(()),
            Some(Ok(request)) => window.take(&request, output)?,
            Some(Err(error)) => return Err(Error::Nbd(error)),
            None => {
                let answer = window.receive()?;
                window.settle(answer, Some(output))?;
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use std::io::{self, Cursor};
    use std::sync::{Arc, Condvar, Mutex};
    use std::time::Duration;

    use super::*;

    /// The disk handle the tests open.
    const HANDLE: u64 = 7;

    /// How long a client waits for a reply before leaving.
    ///
    /// Long enough for a run that answers; a run that never answers the
    /// client fails through the client leaving instead of hanging.
    const PATIENCE: Duration = Duration::from_secs(5);

    /// What the reader thread does with a script after the transmission.
    #[derive(Debug, PartialEq, Eq)]
    enum Reader {
        ReadPastEnd,
        Dropped,
    }

    /// A client script that reports a read past its end, and its drop.
    struct Scripted {
        bytes: Cursor<Vec<u8>>,
        events: mpsc::Sender<Reader>,
    }

    impl Read for Scripted {
        fn read(&mut self, buffer: &mut [u8]) -> io::Result<usize> {
            let count = self.bytes.read(buffer)?;
            if count == 0 && !buffer.is_empty() {
                let _ = self.events.send(Reader::ReadPastEnd);
            }
            Ok(count)
        }
    }

    impl Drop for Scripted {
        fn drop(&mut self) {
            let _ = self.events.send(Reader::Dropped);
        }
    }

    /// An output that breaks after `limit` bytes, as a client that stopped reading does.
    struct Broken {
        written: Vec<u8>,
        limit: usize,
    }

    impl Write for Broken {
        fn write(&mut self, bytes: &[u8]) -> io::Result<usize> {
            if self.written.len() + bytes.len() > self.limit {
                return Err(io::Error::from(io::ErrorKind::BrokenPipe));
            }
            self.written.extend_from_slice(bytes);
            Ok(bytes.len())
        }

        fn flush(&mut self) -> io::Result<()> {
            Ok(())
        }
    }

    /// How many replies the client has seen, counted by its output.
    type Seen = Arc<(Mutex<usize>, Condvar)>;

    /// A client sending bursts, each once it has seen the replies it waits for.
    ///
    /// A read returns at most the rest of one burst. The client leaves when a
    /// reply takes longer than `PATIENCE`.
    struct Bursts {
        bursts: VecDeque<(usize, Vec<u8>)>,
        seen: Seen,
    }

    impl Read for Bursts {
        fn read(&mut self, buffer: &mut [u8]) -> io::Result<usize> {
            let Some((needed, burst)) = self.bursts.front_mut() else {
                return Ok(0);
            };
            let (replies, ready) = &*self.seen;
            let seen = replies.lock().unwrap();
            let (seen, timeout) = ready
                .wait_timeout_while(seen, PATIENCE, |seen| *seen < *needed)
                .unwrap();
            drop(seen);
            if timeout.timed_out() {
                return Ok(0);
            }
            let count = burst.len().min(buffer.len());
            buffer[..count].copy_from_slice(&burst[..count]);
            burst.drain(..count);
            if burst.is_empty() {
                self.bursts.pop_front();
            }
            Ok(count)
        }
    }

    /// An output counting the replies written, for a client in bursts to see.
    struct Counting {
        written: Vec<u8>,
        seen: Seen,
    }

    impl Write for Counting {
        fn write(&mut self, bytes: &[u8]) -> io::Result<usize> {
            self.written.extend_from_slice(bytes);
            if bytes.starts_with(&nbd::SIMPLE_REPLY_MAGIC.to_be_bytes()) {
                let (replies, ready) = &*self.seen;
                *replies.lock().unwrap() += 1;
                ready.notify_all();
            }
            Ok(bytes.len())
        }

        fn flush(&mut self) -> io::Result<()> {
            Ok(())
        }
    }

    /// A client in bursts, each (replies to see first, bytes), and its output.
    fn bursts(bursts: Vec<(usize, Vec<u8>)>) -> (Bursts, Counting) {
        let seen = Seen::default();
        let input = Bursts {
            bursts: bursts.into(),
            seen: Arc::clone(&seen),
        };
        let output = Counting {
            written: Vec::new(),
            seen,
        };
        (input, output)
    }

    /// The compression every test asks for, skipz.
    const COMPRESSION: disk::Compression = disk::Compression::Skipz;

    /// `data` as a skipz stream of one segment covering the chunk.
    fn one_segment(data: &[u8]) -> Vec<u8> {
        let length = u32::try_from(data.len()).unwrap().to_le_bytes();
        let mut wire = length.to_vec();
        wire.extend_from_slice(&[0; 4]);
        wire.extend_from_slice(&[0; 4]);
        wire.extend_from_slice(&length);
        wire.extend_from_slice(data);
        wire
    }

    /// A host answering one read in flight whole, in one chunk, newest first.
    ///
    /// Records every read issued, in order, and the most in flight at once.
    #[derive(Default)]
    struct Fake {
        issued: Vec<(u64, u32)>,
        /// The compression its chunks declare; 3 wraps the bytes as one skipz segment.
        answers_with: u32,
        in_flight: Vec<u32>,
        most_in_flight: usize,
        /// Answers the oldest read in flight first.
        oldest_first: bool,
        /// Answers every chunk with an overlap error instead.
        failing: bool,
        /// Names this index instead of the read's.
        stray: Option<usize>,
    }

    impl Host for Fake {
        type Pending = u32;

        fn issue(
            &mut self,
            handle: u64,
            offset: u64,
            length: u32,
            compression: disk::Compression,
        ) -> Result<u32, Error> {
            assert_eq!((handle, compression), (HANDLE, COMPRESSION));
            let sequence = u32::try_from(self.issued.len()).unwrap();
            self.issued.push((offset, length));
            self.in_flight.push(sequence);
            self.most_in_flight = self.most_in_flight.max(self.in_flight.len());
            Ok(sequence)
        }

        fn receive(&mut self, in_flight: &[u32]) -> Result<Answer, Error> {
            assert_eq!(
                in_flight, self.in_flight,
                "the window names the reads issued and unanswered"
            );
            if self.failing {
                return Err(Error::Chunk(disk::Error::Overlap {
                    offset: 0,
                    length: 512,
                }));
            }
            assert!(!in_flight.is_empty(), "a read is in flight");
            let index = if self.oldest_first {
                0
            } else {
                in_flight.len() - 1
            };
            let sequence = self.in_flight.remove(index);
            let (offset, length) = self.issued[sequence as usize];
            let mut data = vec![0_u8; length as usize];
            low_bytes(offset, &mut data);
            if self.answers_with == COMPRESSION.code() {
                data = one_segment(&data);
            }
            let chunk = disk::Chunk {
                base_offset: offset,
                total_length: length,
                offset: 0,
                length,
                compression: self.answers_with,
            };
            Ok((self.stray.unwrap_or(index), chunk, data))
        }
    }

    /// `NBD_CMD_FLUSH`, which the export never serves.
    const CMD_FLUSH: u16 = 3;

    /// The bytes of a client sending `option` with no data.
    fn negotiation(option: u32) -> Vec<u8> {
        let mut bytes = nbd::FLAG_C_FIXED_NEWSTYLE.to_be_bytes().to_vec();
        bytes.extend_from_slice(&nbd::IHAVEOPT.to_be_bytes());
        bytes.extend_from_slice(&option.to_be_bytes());
        bytes.extend_from_slice(&0_u32.to_be_bytes());
        bytes
    }

    /// The bytes of `requests`, each (type, offset, length), the index as cookie.
    fn requests(requests: &[(u16, u64, u32)]) -> Vec<u8> {
        let mut bytes = Vec::new();
        for (index, (kind, offset, length)) in requests.iter().enumerate() {
            bytes.extend_from_slice(&nbd::REQUEST_MAGIC.to_be_bytes());
            bytes.extend_from_slice(&[0, 0]);
            bytes.extend_from_slice(&kind.to_be_bytes());
            bytes.extend_from_slice(&u64::try_from(index).unwrap().to_be_bytes());
            bytes.extend_from_slice(&offset.to_be_bytes());
            bytes.extend_from_slice(&length.to_be_bytes());
        }
        bytes
    }

    /// A client sending `option` with no data, then `requests` all at once.
    fn client_with(option: u32, list: &[(u16, u64, u32)]) -> Cursor<Vec<u8>> {
        let mut bytes = negotiation(option);
        bytes.extend(requests(list));
        Cursor::new(bytes)
    }

    /// A client naming the export, then sending `requests` all at once.
    fn client(requests: &[(u16, u64, u32)]) -> Cursor<Vec<u8>> {
        client_with(nbd::OPT_EXPORT_NAME, requests)
    }

    /// What every transmission writes first.
    fn preamble(capacity: u64) -> Vec<u8> {
        let mut bytes = nbd::greeting().to_vec();
        bytes.extend_from_slice(&nbd::export_reply(capacity, false));
        bytes
    }

    /// Fills the buffer with the low byte of each disk offset.
    fn low_bytes(offset: u64, buffer: &mut [u8]) {
        for (index, byte) in buffer.iter_mut().enumerate() {
            *byte = (offset + u64::try_from(index).unwrap()).to_le_bytes()[0];
        }
    }

    /// A successful reply for `cookie` holding the low bytes of `length` offsets from `offset`.
    fn answered(cookie: u64, offset: u64, length: u64) -> Vec<u8> {
        let mut reply = nbd::simple_reply(cookie, 0).to_vec();
        let mut data = vec![0_u8; usize::try_from(length).unwrap()];
        low_bytes(offset, &mut data);
        reply.extend_from_slice(&data);
        reply
    }

    fn depth(depth: usize) -> NonZeroUsize {
        NonZeroUsize::new(depth).unwrap()
    }

    /// Runs a transmission at `depth` against a fresh fake host on `input`.
    fn transmit_at<R: Read + Send + 'static>(
        input: R,
        capacity: u64,
        depth: usize,
    ) -> (Result<(), Error>, Vec<u8>, Fake) {
        let mut output = Vec::new();
        let mut fake = Fake::default();
        let outcome = transmit(
            input,
            &mut output,
            nfc::Disk {
                handle: HANDLE,
                capacity,
            },
            self::depth(depth),
            COMPRESSION,
            Transcript::new(false),
            &mut fake,
        );
        (outcome, output, fake)
    }

    #[test]
    fn the_tally_reports_each_crossing_of_a_progress_step_once() {
        let mut tally = Tally::default();

        assert!(!tally.served(PROGRESS_STEP - 1));
        assert!(tally.served(1));
        assert!(!tally.served(PROGRESS_STEP - 1));
        assert!(tally.served(2 * PROGRESS_STEP + 1));
        assert_eq!(tally.served, 4 * PROGRESS_STEP);
    }

    #[test]
    fn transmission_ends_cleanly_at_disc_after_refusing_other_requests() {
        let input = client(&[
            (nbd::CMD_WRITE, 0, 0),
            (CMD_FLUSH, 0, 0),
            (nbd::CMD_DISC, 0, 0),
        ]);

        let (outcome, output, fake) = transmit_at(input, 512, 16);

        outcome.unwrap();
        let mut expected = preamble(512);
        expected.extend_from_slice(&nbd::simple_reply(0, nbd::EPERM));
        expected.extend_from_slice(&nbd::simple_reply(1, nbd::EINVAL));
        assert_eq!(output, expected);
        assert!(
            fake.issued.is_empty(),
            "the host was asked {:?}",
            fake.issued
        );
    }

    #[test]
    fn an_abort_during_negotiation_ends_the_run_cleanly_without_a_transmission() {
        let input = client_with(nbd::OPT_ABORT, &[(nbd::CMD_READ, 0, 512)]);

        let (outcome, output, fake) = transmit_at(input, 512, 16);

        outcome.unwrap();
        let mut expected = nbd::greeting().to_vec();
        expected.extend(nbd::option_reply(nbd::OPT_ABORT, nbd::REP_ACK, &[]));
        assert_eq!(
            output, expected,
            "the request after the abort is never read"
        );
        assert!(
            fake.issued.is_empty(),
            "the host was asked {:?}",
            fake.issued
        );
    }

    #[test]
    fn the_advertised_block_sizes_are_the_shape_of_a_host_read() {
        assert_eq!(u64::from(nbd::MIN_BLOCK_SIZE), disk::SECTOR);
        assert_eq!(u64::from(nbd::PREFERRED_BLOCK_SIZE), disk::MIB);
    }

    #[test]
    fn a_read_is_answered_with_the_bytes_at_its_offset_and_an_empty_one_at_once() {
        let input = client(&[
            (nbd::CMD_READ, 254, 4),
            (nbd::CMD_READ, 512, 0),
            (nbd::CMD_DISC, 0, 0),
        ]);

        let (outcome, output, fake) = transmit_at(input, 512, 16);

        outcome.unwrap();
        let mut expected = preamble(512);
        expected.extend_from_slice(&nbd::simple_reply(1, 0));
        expected.extend_from_slice(&nbd::simple_reply(0, 0));
        expected.extend_from_slice(&[254, 255, 0, 1]);
        assert_eq!(output, expected);
        assert_eq!(fake.issued, [(0, 512)], "one sector-aligned host read");
    }

    #[test]
    fn a_read_past_the_export_is_refused_without_asking_the_host() {
        let input = client(&[
            (nbd::CMD_READ, 511, 2),
            (nbd::CMD_READ, u64::MAX, 1),
            (nbd::CMD_DISC, 0, 0),
        ]);

        let (outcome, output, fake) = transmit_at(input, 512, 16);

        outcome.unwrap();
        let mut expected = preamble(512);
        expected.extend_from_slice(&nbd::simple_reply(0, nbd::EINVAL));
        expected.extend_from_slice(&nbd::simple_reply(1, nbd::EINVAL));
        assert_eq!(output, expected);
        assert!(
            fake.issued.is_empty(),
            "the host was asked {:?}",
            fake.issued
        );
    }

    #[test]
    fn reads_are_issued_in_command_order_up_to_the_depth_and_answered_as_they_complete() {
        let mib = u32::try_from(disk::MIB).unwrap();
        let input = client(&[
            (nbd::CMD_READ, 0, mib),
            (nbd::CMD_READ, disk::MIB, mib),
            (nbd::CMD_READ, 2 * disk::MIB, 2 * mib),
            (nbd::CMD_DISC, 0, 0),
        ]);

        let (outcome, output, fake) = transmit_at(input, 4 * disk::MIB, 2);

        outcome.unwrap();
        assert_eq!(
            fake.issued,
            [
                (0, mib),
                (disk::MIB, mib),
                (2 * disk::MIB, mib),
                (3 * disk::MIB, mib)
            ]
        );
        assert_eq!(
            fake.most_in_flight, 2,
            "never more than the depth in flight"
        );
        let mut expected = preamble(4 * disk::MIB);
        expected.extend(answered(1, disk::MIB, disk::MIB));
        expected.extend(answered(2, 2 * disk::MIB, 2 * disk::MIB));
        expected.extend(answered(0, 0, disk::MIB));
        assert_eq!(output, expected, "replies come as the host completes them");
    }

    #[test]
    fn a_request_is_not_taken_while_the_window_is_full() {
        let mib = u32::try_from(disk::MIB).unwrap();
        let input = client(&[
            (nbd::CMD_READ, 0, mib),
            (nbd::CMD_WRITE, 0, 0),
            (nbd::CMD_DISC, 0, 0),
        ]);

        let (outcome, output, _) = transmit_at(input, disk::MIB, 1);

        outcome.unwrap();
        let mut expected = preamble(disk::MIB);
        expected.extend(answered(0, 0, disk::MIB));
        expected.extend_from_slice(&nbd::simple_reply(1, nbd::EPERM));
        assert_eq!(
            output, expected,
            "the write is refused once the read had its turn"
        );
    }

    #[test]
    fn a_depth_of_one_keeps_one_read_in_flight_and_the_replies_in_order() {
        let mib = u32::try_from(disk::MIB).unwrap();
        let input = client(&[
            (nbd::CMD_READ, 0, 2 * mib),
            (nbd::CMD_READ, 2 * disk::MIB, mib),
            (nbd::CMD_DISC, 0, 0),
        ]);

        let (outcome, output, fake) = transmit_at(input, 3 * disk::MIB, 1);

        outcome.unwrap();
        assert_eq!(fake.most_in_flight, 1);
        assert_eq!(
            fake.issued,
            [(0, mib), (disk::MIB, mib), (2 * disk::MIB, mib)]
        );
        let mut expected = preamble(3 * disk::MIB);
        expected.extend(answered(0, 0, 2 * disk::MIB));
        expected.extend(answered(1, 2 * disk::MIB, disk::MIB));
        assert_eq!(output, expected);
    }

    #[test]
    fn requests_that_arrived_together_form_one_batch_and_the_next_waits_for_more() {
        let read = (nbd::CMD_READ, 0, 512);
        let disc = (nbd::CMD_DISC, 0, 0);
        let (input, _) = bursts(vec![
            (0, requests(&[read])),
            (0, requests(&[read, read, disc])),
        ]);

        let batches = read_requests(input);

        let kinds = |batch: Batch| {
            batch
                .into_iter()
                .map(|request| request.unwrap().kind)
                .collect::<Vec<_>>()
        };
        assert_eq!(kinds(batches.recv().unwrap()), [nbd::CMD_READ]);
        assert_eq!(
            kinds(batches.recv().unwrap()),
            [nbd::CMD_READ, nbd::CMD_READ, nbd::CMD_DISC]
        );
        assert!(batches.recv().is_err(), "the reader ends at disc");
    }

    #[test]
    fn a_client_that_waits_for_its_reply_before_sending_more_is_answered_meanwhile() {
        let mut first = negotiation(nbd::OPT_EXPORT_NAME);
        first.extend(requests(&[(nbd::CMD_READ, 0, 512)]));
        let (input, mut output) = bursts(vec![(0, first), (1, requests(&[(nbd::CMD_DISC, 0, 0)]))]);
        let mut fake = Fake::default();

        let outcome = transmit(
            input,
            &mut output,
            nfc::Disk {
                handle: HANDLE,
                capacity: 512,
            },
            depth(16),
            COMPRESSION,
            Transcript::new(false),
            &mut fake,
        );

        outcome.unwrap();
        let mut expected = preamble(512);
        expected.extend(answered(0, 0, 512));
        assert_eq!(output.written, expected);
    }

    #[test]
    fn a_failed_read_answers_eio_to_every_command_in_flight_and_ends_the_run() {
        let input = client(&[
            (nbd::CMD_READ, 0, 512),
            (nbd::CMD_READ, 512, 512),
            (nbd::CMD_DISC, 0, 0),
        ]);
        let mut output = Vec::new();
        let mut fake = Fake {
            failing: true,
            ..Fake::default()
        };

        let error = transmit(
            input,
            &mut output,
            nfc::Disk {
                handle: HANDLE,
                capacity: 1024,
            },
            depth(16),
            COMPRESSION,
            Transcript::new(false),
            &mut fake,
        )
        .unwrap_err();

        assert_eq!(
            error.to_string(),
            "data plane: chunk: 512 bytes at offset 0 overlap a chunk already received"
        );
        let mut expected = preamble(1024);
        expected.extend_from_slice(&nbd::simple_reply(0, nbd::EIO));
        expected.extend_from_slice(&nbd::simple_reply(1, nbd::EIO));
        assert_eq!(output, expected);
        assert_eq!(fake.issued, [(0, 512), (512, 512)], "both were in flight");
    }

    #[test]
    fn a_chunk_is_decoded_as_its_reply_declares_before_it_is_placed() {
        let input = client(&[(nbd::CMD_READ, 0, 512), (nbd::CMD_DISC, 0, 0)]);
        let mut output = Vec::new();
        let mut fake = Fake {
            answers_with: COMPRESSION.code(),
            ..Fake::default()
        };

        transmit(
            input,
            &mut output,
            nfc::Disk {
                handle: HANDLE,
                capacity: 512,
            },
            depth(16),
            COMPRESSION,
            Transcript::new(false),
            &mut fake,
        )
        .unwrap();

        let mut expected = preamble(512);
        expected.extend(answered(0, 0, 512));
        assert_eq!(output, expected);
    }

    #[test]
    fn a_chunk_that_does_not_decode_answers_eio_and_ends_the_run() {
        let input = client(&[(nbd::CMD_READ, 0, 512), (nbd::CMD_DISC, 0, 0)]);
        let mut output = Vec::new();
        let mut fake = Fake {
            answers_with: 2,
            ..Fake::default()
        };

        let error = transmit(
            input,
            &mut output,
            nfc::Disk {
                handle: HANDLE,
                capacity: 512,
            },
            depth(16),
            COMPRESSION,
            Transcript::new(false),
            &mut fake,
        )
        .unwrap_err();

        assert_eq!(
            error.to_string(),
            "data plane: chunk: 512 bytes at offset 0 came with compression 2, which is not decoded"
        );
        let mut expected = preamble(512);
        expected.extend_from_slice(&nbd::simple_reply(0, nbd::EIO));
        assert_eq!(output, expected);
    }

    #[test]
    fn a_chunk_matched_to_no_read_in_flight_ends_the_run_with_eio() {
        let input = client(&[(nbd::CMD_READ, 0, 512), (nbd::CMD_DISC, 0, 0)]);
        let mut output = Vec::new();
        let mut fake = Fake {
            stray: Some(7),
            ..Fake::default()
        };

        let error = transmit(
            input,
            &mut output,
            nfc::Disk {
                handle: HANDLE,
                capacity: 512,
            },
            depth(16),
            COMPRESSION,
            Transcript::new(false),
            &mut fake,
        )
        .unwrap_err();

        assert_eq!(
            error.to_string(),
            "data plane: a chunk was matched to read 7 of 1 in flight"
        );
        let mut expected = preamble(512);
        expected.extend_from_slice(&nbd::simple_reply(0, nbd::EIO));
        assert_eq!(output, expected);
    }

    #[test]
    fn the_reader_thread_ends_at_disc_without_reading_further() {
        let (sender, events) = mpsc::channel();
        let input = Scripted {
            bytes: client(&[(nbd::CMD_DISC, 0, 0)]),
            events: sender,
        };

        let (outcome, _, _) = transmit_at(input, 512, 16);

        outcome.unwrap();
        assert_eq!(events.recv(), Ok(Reader::Dropped));
    }

    #[test]
    fn a_chunk_is_placed_at_its_disk_position_and_clipped_to_the_window() {
        let mut window = [0_u8; 8];
        place(100, &mut window, 98, &[1, 2, 3, 4]);
        assert_eq!(window, [3, 4, 0, 0, 0, 0, 0, 0]);
        place(100, &mut window, 104, &[5, 6]);
        assert_eq!(window, [3, 4, 0, 0, 5, 6, 0, 0]);
        place(100, &mut window, 107, &[7, 8, 9]);
        assert_eq!(window, [3, 4, 0, 0, 5, 6, 0, 7]);
    }

    #[test]
    fn a_chunk_outside_the_window_leaves_it_untouched() {
        let mut window = [9_u8; 4];
        place(100, &mut window, 96, &[1, 2, 3, 4]);
        place(100, &mut window, 104, &[1, 2, 3, 4]);
        place(100, &mut window, 0, &[]);
        place(u64::MAX, &mut window, 0, &[1]);
        place(0, &mut window, u64::MAX, &[1]);
        assert_eq!(window, [9; 4]);
    }

    #[test]
    fn a_client_that_leaves_before_disc_is_an_nbd_failure() {
        let (outcome, _, _) = transmit_at(client(&[]), 512, 16);

        assert_eq!(
            outcome.unwrap_err().to_string(),
            "the nbd client left without disconnecting"
        );
    }

    #[test]
    fn a_client_that_leaves_with_reads_in_flight_has_them_finished() {
        let input = client(&[(nbd::CMD_READ, 0, 512), (nbd::CMD_READ, 512, 512)]);

        let (outcome, _, fake) = transmit_at(input, 1024, 16);

        assert_eq!(
            outcome.unwrap_err().to_string(),
            "the nbd client left without disconnecting"
        );
        assert_eq!(fake.issued.len(), 2);
        assert!(fake.in_flight.is_empty(), "every read was finished");
    }

    #[test]
    fn a_client_that_stops_reading_has_the_reads_in_flight_finished_and_no_more_issued() {
        let mib = u32::try_from(disk::MIB).unwrap();
        let input = client(&[(nbd::CMD_READ, 0, 512), (nbd::CMD_READ, disk::MIB, 3 * mib)]);
        let mut output = Broken {
            written: Vec::new(),
            limit: preamble(4 * disk::MIB).len(),
        };
        let mut fake = Fake {
            oldest_first: true,
            ..Fake::default()
        };

        let error = transmit(
            input,
            &mut output,
            nfc::Disk {
                handle: HANDLE,
                capacity: 4 * disk::MIB,
            },
            depth(2),
            COMPRESSION,
            Transcript::new(false),
            &mut fake,
        )
        .unwrap_err();

        assert_eq!(
            error.to_string(),
            "the nbd client left without disconnecting"
        );
        assert_eq!(output.written, preamble(4 * disk::MIB));
        assert_eq!(
            fake.issued,
            [(0, 512), (disk::MIB, mib)],
            "the reads still queued were never issued"
        );
        assert!(
            fake.in_flight.is_empty(),
            "every read in flight was finished"
        );
    }
}
