<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Xen Orchestra − Usage Report − {{style.currDate}}</title>
  <style>
    html, body {
      font-family: 'Legacy',sans-serif;
    }

    .page:not(:first-child) {
      page-break-before: always;
      margin-top: 40px;
    }

    table {
      page-break-inside: avoid;
    }

    #pageHeader .logo {
      overflow:auto;
      float: left;
      width: 300px;
    }

    #pageHeader .logo img {
      width: 50px;;
      height: 50px;
      float: left;
    }

    #pageHeader .logo label {
      font-weight: 450;
      font-size: 28px;
      color: #171717;
      margin-top:8px;
      margin-left: 5px;
      display:inline-block;
    }

    #pageHeader .date {
      float: right;
      margin-right: 10px;
      margin-top:12px;
    }

    #pageHeader .date span {
      font-size: 20px;
    }

    #pageHeader hr {
      margin-top: 7%;
    }

    .page .global {
      border-collapse: collapse;
      margin: auto;
      border: 1px solid #95a5a6;
    }

    .page .global  tr:nth-child(1) td {
      border: 1px solid #95a5a6;
      padding: 15px;
      font-size: 35px;
      background-color: #95a5a6;
      color: #ecf0f1;
      text-shadow: 1px 0px 0px #ecf0f1;
      text-align: center;
    }

    .page .global tr td:not(#title) {
      margin-left:10px;
      padding: 10px;
      font-size: 12px;
    }

    .page .global tr td:nth-child(1):not(#title) {
      font-weight: 600;
      font-size: 12px;
    }

    .page .global tr:nth-child(2) td {
      border-top: 1px solid #95a5a6;
    }

    .top table{
      margin: auto;
      margin-top: 20px;
      min-width: 30em;
    }

    .top table caption {
      border: 1px solid #95a5a6;
      font-size: 18px;
      background-color: #95a5a6;
      color: #ecf0f1;
      text-shadow: 1px 0px 0px #ecf0f1;
      text-align: center;
      height: 30px;
      line-height:30px;
    }

    .top table .tableHeader{
      background-color: #DCDDDE;
      text-align: center;
      font-size: 16px;
      width: 60px;
    }

    .top table th {
      background-color: #DCDDDE;
    }

    .top table td:not(.tableHeader){
      padding: 10px;
      font-size: 13px;
      border:1px solid #95a5a6;
      text-align: center;
    }

    .allResources table {
      min-width: 60em
    }
  </style>
</head>
<body>

    <div id="pageHeader">
      <div class="logo">
        <img src="{{style.imgXo}}" alt= "Xo Logo"> <label>XOA</label>
      </div>
      <div class="date">
          <span>{{#if style.prevDate}} {{style.prevDate}} {{else}} 0000-00-00 {{/if}}</span> - <span>{{style.currDate}}</span>
      </div>
        <br>
        <hr color="#95a5a6" size="1px"/>
    </div>

    {{!-- Do not use the footer for pure HTML version
    <div id="pageFooter"  align="center">
      <hr color="#95a5a6" size="1px"/>
      <span style="color:#7f8c8d">-{{style.page}}-</span>
    </div>
    --}}

    <div class="page">

      <table class="global">
        <tr>
          <td id="title" rowspan="8">VMs</td>
        </tr>
        <tr>
          <td>Number:</td>
          <td>{{global.vms.number}} {{normaliseEvolution global.vmsEvolution.number}}</td>
        </tr>
        <tr>
          <td>CPU:</td>
          <td>{{normaliseValue global.vms.cpu}} % {{normaliseEvolution global.vmsEvolution.cpu}}</td>
        </tr>
        <tr>
          <td>RAM:</td>
          <td>{{normaliseValue global.vms.ram}} GiB {{normaliseEvolution global.vmsEvolution.ram}}</td>
        </tr>
        <tr>
          <td>Disk read:</td>
          <td>{{normaliseValue global.vms.diskRead}} MiB {{normaliseEvolution global.vmsEvolution.diskRead}}
          </td>
        </tr>
        <tr>
          <td>Disk write:</td>
          <td>{{normaliseValue global.vms.diskWrite}} MiB {{normaliseEvolution global.vmsEvolution.diskWrite}}
          </td>
        </tr>
        <tr>
          <td>Network RX:</td>
          <td>{{normaliseValue global.vms.netReception}} KiB {{normaliseEvolution global.vmsEvolution.netReception}}
          </td>
        </tr>
        <tr>
          <td>Network TX:</td>
          <td>{{normaliseValue global.vms.netTransmission}} KiB {{normaliseEvolution global.vmsEvolution.netTransmission}}
          </td>
        </tr>
      </table>

      <div class="top">

        <table>
          <caption>Top VMs</caption>
          <tr>
            <th></th>
            <th>UUID</th>
            <th>Name</th>
            <th>Value</th>
          </tr>

          <tr>
            <td rowspan='{{math topVms.cpu.length "+" 1}}' class="tableHeader">CPU</td>
          </tr>
          {{#each topVms.cpu}}
          <tr>
            <td>{{shortUUID this.uuid}}</td>
            <td>{{this.name}}</td>
            <td>{{normaliseValue this.value}} %</td>
          </tr>
          {{/each}}

          <tr>
            <td rowspan='{{math topVms.ram.length "+" 1}}' class="tableHeader">RAM</td>
          </tr>
          {{#each topVms.ram}}
          <tr>
            <td>{{shortUUID this.uuid}}</td>
            <td>{{this.name}}</td>
            <td>{{normaliseValue this.value}} GiB</td>
          </tr>
          {{/each}}
          <tr>
            <td rowspan='{{math topVms.diskRead.length "+" 1}}' class="tableHeader">Disk read</td>
          </tr>
          {{#each topVms.diskRead}}
          <tr>
            <td>{{shortUUID this.uuid}}</td>
            <td>{{this.name}}</td>
            <td>{{normaliseValue this.value}} MiB</td>
          </tr>
          {{/each}}
          <tr>
            <td rowspan='{{math topVms.diskWrite.length "+" 1}}' class="tableHeader">Disk write</td>
          </tr>
          {{#each topVms.diskWrite}}
          <tr>
            <td>{{shortUUID this.uuid}}</td>
            <td>{{this.name}}</td>
            <td>{{normaliseValue this.value}} MiB</td>
          </tr>
          {{/each}}

          {{getTopIops topVms}}

          <tr>
            <td rowspan='{{math topVms.netReception.length "+" 1}}' class="tableHeader">Network RX</td>
          </tr>
          {{#each topVms.netReception}}
          <tr>
            <td>{{shortUUID this.uuid}}</td>
            <td>{{this.name}}</td>
            <td>{{normaliseValue this.value}} KiB</td>
          </tr>
          {{/each}}
          <tr>
            <td rowspan='{{math topVms.netTransmission.length "+" 1}}' class="tableHeader">Network TX</td>
          </tr>
          {{#each topVms.netTransmission}}
          <tr>
            <td>{{shortUUID this.uuid}}</td>
            <td>{{this.name}}</td>
            <td>{{normaliseValue this.value}} KiB</td>
          </tr>
          {{/each}}
        </table>
      </div>
    </div>

    <div class="page">
      <table class="global">
        <tr>
          <td id="title" rowspan="7">Hosts</td>
        </tr>
        <tr>
          <td>Number:</td>
          <td>{{global.hosts.number}} {{normaliseEvolution global.hostsEvolution.number}}
          </td>
        </tr>
        <tr>
          <td>CPU:</td>
          <td>{{normaliseValue global.hosts.cpu}} % {{normaliseEvolution global.hostsEvolution.cpu}}
          </td>
        </tr>
        <tr>
          <td>RAM:</td>
          <td>{{normaliseValue global.hosts.ram}} GiB {{normaliseEvolution global.hostsEvolution.ram}}
          </td>
        </tr>
        <tr>
          <td>Load average:</td>
          <td>{{normaliseValue global.hosts.load}}  {{normaliseEvolution global.hostsEvolution.load}}
          </td>
        </tr>
        <tr>
          <td>Network RX:</td>
          <td>{{normaliseValue global.hosts.netReception}} KiB {{normaliseEvolution global.hostsEvolution.netReception}}
          </td>
        </tr>
        <tr>
          <td>Network TX:</td>
          <td>{{normaliseValue global.hosts.netTransmission}} KiB {{normaliseEvolution global.hostsEvolution.netTransmission}}
          </td>
        </tr>
      </table>

      <div class="top">

        <table>
          <caption>Top hosts</caption>
          <tr>
            <th></th>
            <th>UUID</th>
            <th>Name</th>
            <th>Value</th>
          </tr>
          <tr>
            <td rowspan='{{math topHosts.cpu.length "+" 1}}' class="tableHeader">CPU</td>
          </tr>
          {{#each topHosts.cpu}}
          <tr>
            <td>{{shortUUID this.uuid}}</td>
            <td>{{this.name}}</td>
            <td>{{normaliseValue this.value}} %</td>
          </tr>
          {{/each}}
          <tr>
            <td rowspan='{{math topHosts.ram.length "+" 1}}' class="tableHeader">RAM</td>
          </tr>
          {{#each topHosts.ram}}
          <tr>
            <td>{{shortUUID this.uuid}}</td>
            <td>{{this.name}}</td>
            <td>{{normaliseValue this.value}} GiB</td>
          </tr>
          {{/each}}
          <tr>
            <td rowspan='{{math topHosts.load.length "+" 1}}' class="tableHeader">Load average</td>
          </tr>
          {{#each topHosts.load}}
          <tr>
            <td>{{shortUUID this.uuid}}</td>
            <td>{{this.name}}</td>
            <td>{{normaliseValue this.value}} </td>
          </tr>
          {{/each}}
          <tr>
            <td rowspan='{{math topHosts.netReception.length "+" 1}}' class="tableHeader">Network RX</td>
          </tr>
          {{#each topHosts.netReception}}
          <tr>
            <td>{{shortUUID this.uuid}}</td>
            <td>{{this.name}}</td>
            <td>{{normaliseValue this.value}} KiB</td>
          </tr>
          {{/each}}
          <tr>
            <td rowspan='{{math topHosts.netTransmission.length "+" 1}}' class="tableHeader">Network TX</td>
          </tr>
          {{#each topHosts.netTransmission}}
          <tr>
            <td>{{shortUUID this.uuid}}</td>
            <td>{{this.name}}</td>
            <td>{{normaliseValue this.value}} KiB</td>
          </tr>
          {{/each}}
        </table>
      </div>
    </div>

    <div class="page">
      <div class="top">
        <table>
          <caption>Top SRs</caption>
            <tr>
              <th />
              <th>UUID</th>
              <th>Name</th>
              <th>value</th>
            </tr>
            {{getTopSrs topSrs}}
          </table>
          <table>
             <caption>Hosts missing patches</caption>
            <tr>
            <th>UUID</th>
            <th>Name</th>
            <th>Patches</th>
            </tr>
              {{#if hostsMissingPatches}}
                {{#each hostsMissingPatches}}
                <tr>
                  <td>{{shortUUID this.uuid}}</td>
                  <td>{{this.name}}</td>
                  <td>{{this.patches}}</td>
                </tr>
                {{/each}}
              {{else}}
                <tr>
                  <td colspan="3">All hosts are updated!</td>
                </tr>
              {{/if}}
          </table>
          <table>
            <caption>Added Users</caption>
            <tr>
              <th>Email</th>
            </tr>
            {{#if usersEvolution.added}}
              {{#each usersEvolution.added}}
              <tr>
                <td>{{this}}</td>
              </tr>
              {{/each}}
            {{else}}
              <tr>
                <td>No added users!</td>
              </tr>
            {{/if}}
          </table>
          <table>
            <caption>Removed Users</caption>
            <tr>
              <th>Email</th>
            </tr>
            {{#if usersEvolution.removed}}
              {{#each usersEvolution.removed}}
              <tr>
                <td>{{this}}</td>
              </tr>
              {{/each}}
            {{else}}
              <tr>
                <td>No removed users!</td>
              </tr>
            {{/if}}
          </table>
          <table>
            <caption>Added Vms</caption>
            <tr>
              <th>UUID</th>
              <th>Name</th>
            </tr>
            {{#if vmsResourcesEvolution.added}}
              {{#each vmsResourcesEvolution.added}}
                <tr>
                  <td>{{shortUUID this.uuid}}</td>
                  <td>{{this.name}}</td>
                </tr>
              {{/each}}
            {{else}}
              <tr>
                <td colspan="2">No added VMs!</td>
              </tr>
            {{/if}}
          </table>

          <table>
            <caption>Removed Vms</caption>
            <tr>
              <th>UUID</th>
              <th>Name</th>
            </tr>
            {{#if vmsResourcesEvolution.removed}}
              {{#each vmsResourcesEvolution.removed}}
              <tr>
                <td>{{shortUUID this.uuid}}</td>
                <td>{{this.name}}</td>
              </tr>
              {{/each}}
            {{else}}
              <tr>
                <td colspan="2">No removed VMs!</td>
              </tr>
            {{/if}}
          </table>
          <table>
            <caption>Added Hosts</caption>
            <tr>
              <th>UUID</th>
              <th>Name</th>
            </tr>
            {{#if hostsResourcesEvolution.added}}
              {{#each hostsResourcesEvolution.added}}
              <tr>
                <td>{{shortUUID this.uuid}}</td>
                <td>{{this.name}}</td>
              </tr>
              {{/each}}
            {{else}}
              <tr>
                <td colspan="2">No added Hosts!</td>
              </tr>
            {{/if}}
          </table>
          <table>
            <caption>Removed Hosts</caption>
            <tr>
              <th>UUID</th>
              <th>Name</th>
            </tr>
            {{#if hostsResourcesEvolution.removed}}
              {{#each hostsResourcesEvolution.removed}}
              <tr>
                <td>{{shortUUID this.uuid}}</td>
                <td>{{this.name}}</td>
              </tr>
              {{/each}}
            {{else}}
              <tr>
                <td colspan="2">No removed Hosts!</td>
              </tr>
            {{/if}}
          </table>
      </div>
    </div>
    {{#if allResources}}
      <div class="page">
        <div class="top allResources">
          <hr color="#95a5a6" size="1px"/>
          <h3 style="text-align: center;">All resources</h3>
          <hr color="#95a5a6" size="1px"/>
          <table>
            <caption>VMs</caption>
            <tr>
              <th>UUID</th>
              <th>Name</th>
              <th>IP addresses</th>
              <th>CPU</th>
              <th>RAM (GiB)</th>
              <th>Disk read (MiB)</th>
              <th>Disk write (MiB)</th>
              <th>IOPS read</th>
              <th>IOPS write</th>
              <th>IOPS total</th>
              <th>Network RX (KiB)</th>
              <th>Network TX (KiB)</th>
            </tr>
            {{#each allResources.vms}}
              <tr>
                <td>{{shortUUID this.uuid}}</td>
                <td>{{this.name}}</td>
                <td>{{formatAddresses this.addresses}}</td>
                <td>{{normaliseValue this.cpu}} % {{normaliseEvolution this.evolution.cpu}}</td>
                <td>{{normaliseValue this.ram}} {{normaliseEvolution this.evolution.ram}}</td>
                <td>{{normaliseValue this.diskRead}} {{normaliseEvolution this.evolution.diskRead}}</td>
                <td>{{normaliseValue this.diskWrite}} {{normaliseEvolution this.evolution.diskWrite}}</td>
                <td>{{formatIops this.iopsRead}} {{normaliseEvolution this.evolution.iopsRead}}</td>
                <td>{{formatIops this.iopsWrite}} {{normaliseEvolution this.evolution.iopsWrite}}</td>
                <td>{{formatIops this.iopsTotal}} {{normaliseEvolution this.evolution.iopsTotal}}</td>
                <td>{{normaliseValue this.netReception}} {{normaliseEvolution this.evolution.netReception}}</td>
                <td>{{normaliseValue this.netTransmission}} {{normaliseEvolution this.evolution.netTransmission}}</td>
              </tr>
            {{/each}}
          </table>
          <table>
            <caption>Hosts</caption>
            <tr>
              <th>UUID</th>
              <th>Name</th>
              <th>CPU</th>
              <th>RAM (GiB)</th>
              <th>Load average</th>
              <th>Network RX (KiB)</th>
              <th>Network TX (KiB)</th>
            </tr>
            {{#each allResources.hosts}}
              <tr>
                <td>{{shortUUID this.uuid}}</td>
                <td>{{this.name}}</td>
                <td>{{normaliseValue this.cpu}} % {{normaliseEvolution this.evolution.cpu}}</td>
                <td>{{normaliseValue this.ram}} {{normaliseEvolution this.evolution.ram}}</td>
                <td>{{normaliseValue this.load}} {{normaliseEvolution this.evolution.load}}</td>
                <td>{{normaliseValue this.netReception}} {{normaliseEvolution this.evolution.netReception}}</td>
                <td>{{normaliseValue this.netTransmission}} {{normaliseEvolution this.evolution.netTransmission}}</td>
              </tr>
            {{/each}}
          </table>
          <table>
            <caption>SRs</caption>
            <tr>
              <th>UUID</th>
              <th>Name</th>
              <th>Total space (GiB)</th>
              <th>Used space (GiB)</th>
              <th>Free space (GiB)</th>
            </tr>
            {{#each allResources.srs}}
              <tr>
                <td>{{shortUUID this.uuid}}</td>
                <td>{{this.name}}</td>
                <td>{{normaliseValue this.total}} {{normaliseEvolution this.evolution.total}}</td>
                <td>{{normaliseValue this.usedSpace}}</td>
                <td>{{normaliseValue this.freeSpace}}</td>
              </tr>
            {{/each}}
          </table>
        </div>
      </div>
    {{/if}}
</body>
</html>
