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

    <!-- Le styles -->
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
		  <a class="brand" href="#">Xen Orchestra</a>	
          <a class="btn btn-navbar" data-toggle="collapse" data-target=".nav-collapse">
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
          </a>
          <a class="brand" href="#"></a>
          <div class="nav-collapse collapse">
            <ul class="nav">
              <!--<li class="active"><a href="#">Home</a></li>-->
              <li class="dropdown"> <a class="dropdown-toggle" data-toggle="dropdown" href="#"><i class="icon-hdd"></i> Vm <b class="caret"></b> </a>
		          <ul class="dropdown-menu">
		            <li><a href="#">Add new...</a></li>
		            <li><a href="#">Manage</a></li>
		            <li><a href="#">Templates</a></li>
		            <li><a href="#">List</a></li>
		            <li class="divider"></li>
		            <li><a href="#">Options...</a></li>
		          </ul>
			  </li>
              <li class="dropdown"> <a class="dropdown-toggle" data-toggle="dropdown" href="#"><i class="icon-reorder"></i> Server <b class="caret"></b> </a>
		          <ul class="dropdown-menu">
		            <li><a href="#">Add new...</a></li>
		            <li><a href="#">Manage</a></li>
		            <li><a href="#">List</a></li>
		            <li class="divider"></li>
		            <li><a href="#">Options...</a></li>
		          </ul>
			  </li>
              <li><a href="#pools"><i class="icon-cloud"></i> Pool</a></li>
              <li><a href="#pools"><i class="icon-wrench"></i> Configure</a></li>
            </ul>
	      <ul class="nav pull-right">
			<li><a href="/users/sign_up">Register</a></li>
			          <li class="divider-vertical"></li>
			          <li class="dropdown">
			            <a class="dropdown-toggle" href="#" data-toggle="dropdown">Log In <strong class="caret"></strong></a>
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


          </ul>
          	      <form class="navbar-search pull-right" action="">
	        <input class="search-query" type="text" placeholder="Search">
	      </form>
          </div><!--/.nav-collapse -->
        </div>
      </div>
    </div>

    <div class="container">

      <h1>Overview</h1>
      <p>XCP overview</p>
    </div> <!-- /container -->

    <!-- Le javascript
    ================================================== -->
    <!-- Placed at the end of the document so the pages load faster -->
    <script src="../deps/js/jquery.js"></script>
    <script src="../deps/bootstrap/js/bootstrap.js"></script>
  </body>
</html>
