set yrange [ 0 : ]
set grid

plot for [i=2:4] "plot.dat" using 1:i with lines
