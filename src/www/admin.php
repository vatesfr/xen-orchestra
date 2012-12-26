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
							<li class="divider-vertical"></li>              
							<li><a href="admin.php"><i class="icon-wrench"></i> Admin</a></li>
							</ul>
							<ul class="nav pull-right">
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
<div class="container">
<div class="span4 well">
    <div class="accordion-group"> <div class="accordion-heading"><a class="accordion-toggle" href="#item1" data-toggle="collapse"> Users </a> </div>
    <div id="item1" class="collapse in">
      <div class="accordion-inner"> Lorem Ipsum Dolor sit amet</div>
      <div class="accordion-inner"> Lorem Ipsum Dolor sit amet</div>
      <div class="accordion-inner"> Lorem Ipsum Dolor sit amet</div>
    </div></div>
    <div class="accordion-group"> <div class="accordion-heading"> <a class="accordion-toggle" href="#item2" data-toggle="collapse"> Hosts </a> </div>
    <div id="item2" class="collapse in">
      <div class="accordion-inner"> Lorem Ipsum Dolor sit amet </div>
    </div></div>
    <div class="accordion-group"> <div class="accordion-heading"> <a class="accordion-toggle" href="#item3" data-toggle="collapse"> Alerts </a> </div>
    <div id="item3" class="collapse in">
      <div class="accordion-inner"> Lorem Ipsum Dolor sit amet </div>
    </div></div>
  </div>





    </div> <!-- /container -->
<footer class="footer" style="background-color:#c2c2c2">

</footer>

    <!-- Le javascript
    ================================================== -->
    <!-- Placed at the end of the document so the pages load faster -->
    <script src="../deps/js/jquery.js"></script>
    <script src="../deps/bootstrap/js/bootstrap.js"></script>
  </body>
</html>
