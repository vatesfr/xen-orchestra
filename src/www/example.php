<?php
/**
 * This file is a part of Xen Orchestra Web.
 *
 * Xen Orchestra Web is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * Xen Orchestra Web is distributed in the hope that it will be
 * useful, but WITHOUT ANY WARRANTY; without even the implied warranty
 * of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Xen Orchestra Web. If not, see
 * <http://www.gnu.org/licenses/>.
 *
 * @author Olivier Lambert <olivier.lambert@vates.fr>
 * @license http://www.gnu.org/licenses/agpl-3.0-standalone.html GNU AGPLv3
 *
 * @package Xen Orchestra Web
 */

require(__DIR__.'/../bootstrap.php');

?>
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<title>Xen Orchestra</title>
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<meta name="description" content="">
		<meta name="author" content="">
	
		<!-- styles -->
		<link href="../deps/bootstrap/css/bootstrap.css" rel="stylesheet">
		<style>
			body {
			padding-top: 60px; /* 60px to make the container go all the way to the bottom of the topbar */
			}
		</style>
		<link href="../deps/bootstrap/css/bootstrap-responsive.css" rel="stylesheet">
	
		<!-- HTML5 shim, for IE6-8 support of HTML5 elements -->
		<!--[if lt IE 9]>
			<script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
		<![endif]-->
	
	
		<link rel="stylesheet" href="../deps/font-awesome/css/font-awesome.css">
		<link rel="stylesheet" href="css/style.css">
		<link rel="icon" href="img/favicon.ico" />
	</head>

	<body>
		<div class="navbar navbar-fixed-top">
			<div class="navbar-inner">
				<div class="container">
					<a class="brand" href="index.php"><img src="img/bannerb.png"></a><a class="btn btn-navbar" data-toggle="collapse" data-target=".nav-collapse"><span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"></span></a>
					<div class="nav-collapse collapse">
						<ul class="nav">
							<li class="divider-vertical"></li>
							<li class="dropdown"> <a class="dropdown-toggle" data-toggle="dropdown" href="pool.php"><i class="icon-cloud"></i> Pool</a>
							</li>
							<li class="dropdown"> <a class="dropdown-toggle" data-toggle="dropdown" href="#"><i class="icon-cog"></i> Server</a>
							</li>
							<li class="dropdown"> <a class="dropdown-toggle" data-toggle="dropdown" href="#"><i class="icon-check-empty"></i> Vm <b class="caret"></b> </a>
							<ul class="dropdown-menu">
								<li><a href="#"><i class="icon-reorder"></i> List</a></li>
								<li><a href="#"><i class="icon-plus"></i> Add new...</a></li>
								<li><a href="#"><i class="icon-cog"></i> Manage</a></li>
								<li><a href="#"><i class="icon-file"></i> Templates</a></li>
								<li class="divider"></li>
								<li><a href="#"><i class="icon-wrench"></i> Options...</a></li>
							</ul>
							</li>
							<li class="dropdown"> <a class="dropdown-toggle" data-toggle="dropdown" href="#"><i class="icon-hdd"></i> Storage <b class="caret"></b></a>
							<ul class="dropdown-menu">
								<li><a href="#"><i class="icon-reorder"></i> List</a></li>
								<li><a href="#"><i class="icon-plus"></i> Add new...</a></li>
								<li><a href="#"><i class="icon-cog"></i> Manage</a></li>
								<li class="divider"></li>
								<li><a href="#"><i class="icon-wrench"></i> Options...</a></li>
							</ul>
							</li>
							</ul>
							<ul class="nav pull-right">
								<li class="divider-vertical"></li>
								<li><a rel="tooltip" data-original-title="Settings" href="admin/admin.php"><i class="icon-wrench"></i></a></li>
								<li><a id="msg" rel="tooltip" data-original-title="No unread notifications" href="#"><i class="icon-bell"></i></a></li>
								<li class="dropdown">
								<a class="dropdown-toggle" href="#" data-toggle="dropdown"><i class="icon-signin"></i> Log In <strong class="caret"></strong></a>
								<div class="dropdown-menu" style="padding: 15px; padding-bottom: 0px;">
									<!-- Login form here -->
									<form>
										<div class="input-prepend">
											<span class="add-on"><i class="icon-user"></i></span>
											<input class="span2" type="text" placeholder="User">
										</div>
										<div class="input-prepend">
											<span class="add-on"><i class="icon-key"></i></span>
											<input class="span2" type="password" placeholder="Password"></input><br/><br/>
										</div>
										<button type="submit" class="btn btn-info"><i class="icon-signin icon-small"></i> Log In</button>
									</form>
								</div>
							</ul>
							
							<form class="navbar-search pull-right" action="">
								<input class="search-query" type="text" placeholder="Search">
							</form>
						</div><!--/.nav-collapse -->
					</div>
				</div>
			</div>
		</div>
		<!-- end of navbar -->
		
		<div class="row-fluid">
		<div class="span2 offset1">
			<ul class="nav nav-list well">
				<li class="nav-header">Server Manager</li>
				<li class="active"><a href="#">Overview</a></li>
				<li class="nav-header">Management</li>
				<li><a href="#">Add server</a></li>
				<li><a href="#">Connect</a></li>
				<li><a href="#">Disconnect</a></li>
				<li class="nav-header">Connected servers</li>
				<li><a href="#"><i class="icon-cog"></i> Cluster1</a></li>
				<li><a href="#"><i class="icon-cog"></i> Cluster2</a></li>
				<li><a href="#"><i class="icon-cog"></i> Cluster3</a></li>
				<li><a href="#"><i class="icon-cog"></i> Cluster4</a></li>
				<li><a href="#"><i class="icon-cog"></i> Cluster5</a></li>
				<li><a href="#"><i class="icon-cog"></i> Cluster6</a></li>
				<li><a href="#"><i class="icon-cog"></i> Cluster7</a></li>
				<li class="nav-header">Misc</li>
				<li><a href="#">Server Events</a></li>
			</ul>
		</div>
		<div class="span8">
			<h3 class="center">Server overview</h3>
			<table class="table table-bordered table-hover table-striped">
				<caption>Dev Pool</caption>
				<thead>
				<tr>
				<th>Name</th>
				<th>Memory</th>
				<th>Network (avg/max KBs)</th>
				<th>Uptime</th>
				</tr>
				</thead>
				<tbody>
				<tr>
				<td>Cluster1</td>
				<td><div class="progress progress-info progress-small"><div class="bar" style="width: 40%;"></div></div></td>
				<td>3/3</td>
				<td>6 days</td>
				</tr>
				<tr>
				<td>Cluster1</td>
				<td><div class="progress progress-info progress-small"><div class="bar" style="width: 20%;"></div></div></td>
				<td>3/3</td>
				<td>6 days 2 hours 10 minutes</td>
				</tr>
				<tr>
				<td>Cluster1</td>
				<td><div class="progress progress-info progress-small"><div class="bar" style="width: 60%;"></div></div></td>
				<td>3/3</td>
				<td>6 days 2 hours 10 minutes</td>
				</tr>
				</tbody>
				</table>
			<table class="table table-bordered table-hover table-striped">
				<caption>Test Pool</caption>
				<thead>
				<tr>
				<th>Name</th>
				<th>Memory</th>
				<th>Network (avg/max KBs)</th>
				<th>Uptime</th>
				</tr>
				</thead>
				<tbody>
				<tr>
				<td>Cluster1</td>
				<td><div class="progress progress-info progress-small"><div class="bar" style="width: 80%;"></div></div></td>
				<td>3/3</td>
				<td>6 days 2 hours 10 minutes</td>
				</tr>
				<tr>
				<td>Cluster1</td>
				<td><div class="progress progress-info progress-small"><div class="bar" style="width: 70%;"></div></div></td>
				<td>3/3</td>
				<td>6 days 2 hours 10 minutes</td>
				</tr>
				<tr>
				<td>Cluster1</td>
				<td><div class="progress progress-info progress-small"><div class="bar" style="width: 48%;"></div></div></td>
				<td>3/3</td>
				<td>6 days 2 hours 10 minutes</td>
				</tr>
				</tbody>
				</table>
			<table class="table table-bordered table-hover table-striped">
				<caption>Prod Pool</caption>
				<thead>
				<tr>
				<th>Name</th>
				<th>Memory</th>
				<th>Network (avg/max KBs)</th>
				<th>Uptime</th>
				</tr>
				</thead>
				<tbody>
				<tr>
				<td>Cluster1</td>
				<td><div class="progress progress-info progress-small"><div class="bar" style="width: 50%;"></div></div></td>
				<td>3/3</td>
				<td>6 days 2 hours 10 minutes</td>
				</tr>
				<tr>
				<td>Cluster1</td>
				<td><div class="progress progress-info progress-small"><div class="bar" style="width: 35%;"></div></div></td>
				<td>3/3</td>
				<td>6 days 2 hours 10 minutes</td>
				</tr>
				<tr>
				<td>Cluster1</td>
				<td><div class="progress progress-info progress-small"><div class="bar" style="width: 25%;"></div></div></td>
				<td>3/3</td>
				<td>6 days 2 hours 10 minutes</td>
				</tr>
				</tbody>
				</table>
		</div>
			



		<!-- JS Placed at the end of the document so the pages load faster -->
		<script src="../deps/js/jquery.js"></script>
		<script src="../deps/bootstrap/js/bootstrap.js"></script>
		<!-- Tooltip -->
		<script type="text/javascript">
			$(function (){
			$('a:first-child').tooltip({placement:'bottom'});
			$('a').tooltip();
			});
		</script>
		<!-- TODO Blink when notification  -->
		<script type="text/javascript">
			function blink(selector){
			$(selector).fadeOut('slow', function(){
			$(this).fadeIn('slow', function(){
			blink(this);
			});
			});
			}
			blink('#msg');
		</script>
	</body>
</html>
