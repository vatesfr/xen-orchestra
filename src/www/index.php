<?php
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
	</head>

	<body>
		<div class="navbar navbar-fixed-top">
			<div class="navbar-inner">
				<div class="container">
					<a class="brand" href="index.php">Xen Orchestra</a><a class="btn btn-navbar" data-toggle="collapse" data-target=".nav-collapse"><span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"></span></a>
					<div class="nav-collapse collapse">
						<ul class="nav">
							<li class="divider-vertical"></li>
							<li class="dropdown"> <a class="dropdown-toggle" data-toggle="dropdown" href=""><i class="icon-cloud"></i> Pool <b class="caret"></b> </a>
							<ul class="dropdown-menu">
								<li><a href="#"><i class="icon-reorder"></i> List</a></li>
								<li><a href="#"><i class="icon-plus"></i> Add new...</a></li>
								<li><a href="#"><i class="icon-cog"></i> Manage</a></li>
								<li class="divider"></li>
								<li><a href="#"><i class="icon-wrench"></i> Options...</a></li>
							</ul>
							</li>
							<li class="dropdown"> <a class="dropdown-toggle" data-toggle="dropdown" href="#"><i class="icon-reorder"></i> Server <b class="caret"></b></a>
							<ul class="dropdown-menu">
								<li><a href="#"><i class="icon-reorder"></i> List</a></li>
								<li><a href="#"><i class="icon-plus"></i> Add new...</a></li>
								<li><a href="#"><i class="icon-cog"></i> Manage</a></li>
								<li class="divider"></li>
								<li><a href="#"><i class="icon-wrench"></i> Options...</a></li>
							</ul>
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
								<li><a rel="tooltip" data-original-title="Administration page" href="admin.php"><i class="icon-wrench"></i></a></li>
								<li><a rel="tooltip" data-original-title="No unread notifications" href="#"><i class="icon-bell"></i></a></li>
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
			<div class="span10 offset1">  
				<h1 class="center">Welcome on XO!</h1>  
				<p class="center">It seems you don't have any connected host.<br/>Add an XCP host or a Pool master, and start to use the magic of Xen Orchestra.</p><br/>
				<p class="center"><a class="btn btn-success btn-large"><i class="icon-plus"></i>  Add server</a></p>  
			</div>
		</div>
		<br/><br/>
		<div class="row-fluid">
			<div class="span3 offset1 well">  
				<h2 class="center">Need help?</h2>  
				<p>If you don't know how to start, please read the README first. Then, if you have further questions, please read the FAQ on the project website.
				</p><br/>
				<p class="center"><a class="btn btn-info btn-large" data-toggle="modal" href="#infos" ><i class="icon-info-sign"></i> Readme</a></p>  
			</div>
			<div class="span4 well">  
				<h2 class="center">About us</h2>  
				<p>We are the team behind XO, we are Vates! (a french company specialized in Open Source products). We offer commercial support for Xen and Xen Orchestra. Don't be affraid, this project is Open Source, everyone is welcome aboard!</p><br/>
				<p class="center"><a class="btn btn-large" href="http://vates.fr"><i class="icon-circle-arrow-right"></i> Go on our website!</a></p>  
			</div>
			<div class="span3 well">  
				<h2 class="center">Get involved!</h2>  
				<p>You want a specific feature in XO? Report a bug? Go to our project website and get involved in the project!</p><br/>  
				<p class="center"><a class="btn btn-success btn-large" href="http://xen-orchestra.com"><i class="icon-beaker"></i> Project page</a></p>  
			</div>  
		</div>
			
		<div class="modal hide fade" id="infos">
			<div class="modal-header"> <a class="close" data-dismiss="modal">×</a>
				<h3>Initial configuraton</h3>
			</div>
			<div class="modal-body">
				<p>Please add an XCP server or a Pool master. For this, click on the "Let's go" button on the main screen. Otherwise, you can do the same thing by using the top menu ("Server" then "Add").</p>
			</div>
			<div class="modal-footer">
				<a class="btn btn-info" data-dismiss="modal">Close</a>
			</div>
		</div>


		<!-- JS Placed at the end of the document so the pages load faster -->
		<script src="../deps/js/jquery.js"></script>
		<script src="../deps/bootstrap/js/bootstrap.js"></script>
		<!-- Tooltip -->
		<script>
			$(function (){
			$('a:first-child').tooltip({placement:'bottom'});
			$('a').tooltip();
			});
		</script>
	</body>
</html>
