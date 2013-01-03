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
require(__DIR__.'/../../bootstrap.php');

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
		<link href="../../deps/bootstrap/css/bootstrap.css" rel="stylesheet">
		<style>
			body {
			padding-top: 60px; /* 60px to make the container go all the way to the bottom of the topbar */
			}
		</style>
		<link href="../../deps/bootstrap/css/bootstrap-responsive.css" rel="stylesheet">
	
		<!-- HTML5 shim, for IE6-8 support of HTML5 elements -->
		<!--[if lt IE 9]>
			<script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
		<![endif]-->
	
	
		<link rel="stylesheet" href="../../deps/font-awesome/css/font-awesome.css">
		<link rel="stylesheet" href="../css/style.css">
		<link rel="icon" href="../img/favicon.ico" />
	</head>

	<body>
		<div class="navbar navbar-fixed-top">
			<div class="navbar-inner">
				<div class="container">
					<a class="brand" href="../index.php"><img src="../img/bannerb.png"></a><a class="btn btn-navbar" data-toggle="collapse" data-target=".nav-collapse"><span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"></span></a>
					<div class="nav-collapse collapse">
						<ul class="nav">
							<li class="divider-vertical"></li>
							<li> <a href="../pool.php"><i class="icon-cloud"></i> Pool</a>
							</li>
							<li> <a href="../servers.php"><i class="icon-cog"></i> Server</a>
							</li>
							<li class="dropdown"> <a class="dropdown-toggle" data-toggle="dropdown" href="#"><i class="icon-bolt"></i> Vm <b class="caret"></b> </a>
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
				<li class="nav-header">Admin Panel</li>
				<li ><a href="admin.php">Dashboard</a></li>
				<li class="nav-header">Security</li>
				<li><a href="#">Users</a></li>
				<li><a href="#">Groups</a></li>
				<li><a href="#">Policies</a></li>
				<li class="nav-header">XCP settings</li>
				<li class="active"><a href="hosts.php">Hosts</a></li>
				<li><a href="#">Applications</a></li>
				<li class="nav-header">Misc</li>
				<li><a href="#">XO Events</a></li>
			</ul>
		</div>

<div class="span8">
	<div class="accordion-group"> <div class="accordion-heading"><a class="accordion-toggle" href="#item0" data-toggle="collapse"> Configured Hosts </a> </div>
    <div id="item0" class="collapse in">
      <div class="accordion-inner"> Cluster1 (single host)</div>
      <div class="accordion-inner"> Cluster2 (single host)</div>
      <div class="accordion-inner"> XenFr1 (pool master)</div>
    </div></div>
    <div class="accordion-group"> <div class="accordion-heading"> <a class="accordion-toggle" href="#item2" data-toggle="collapse"> Pool master failback </a> </div>
    <div id="item2" class="collapse">
      <div class="accordion-inner"> XenFr2 </div>
    </div></div>
  </div>





    </div> <!-- /container -->
<footer class="footer" style="background-color:#c2c2c2">

</footer>

    <!-- Le javascript
    ================================================== -->
    <!-- Placed at the end of the document so the pages load faster -->
    <script src="../../deps/js/jquery.js"></script>
    <script src="../../deps/bootstrap/js/bootstrap.js"></script>
  </body>
</html>
