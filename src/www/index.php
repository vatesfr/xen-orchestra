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

    <!-- Fav and touch icons -->
    <link rel="apple-touch-icon-precomposed" sizes="144x144" href="../deps/bootstrap/ico/apple-touch-icon-144-precomposed.png">
    <link rel="apple-touch-icon-precomposed" sizes="114x114" href="../deps/bootstrap/ico/apple-touch-icon-114-precomposed.png">
      <link rel="apple-touch-icon-precomposed" sizes="72x72" href="../deps/bootstrap/ico/apple-touch-icon-72-precomposed.png">
                    <link rel="apple-touch-icon-precomposed" href="../deps/bootstrap/ico/apple-touch-icon-57-precomposed.png">
                                   <link rel="shortcut icon" href="../deps/bootstrap/ico/favicon.png">
  </head>

  <body>

    <div class="navbar navbar-inverse navbar-fixed-top">
      <div class="navbar-inner">
        <div class="container">
          <a class="btn btn-navbar" data-toggle="collapse" data-target=".nav-collapse">
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
          </a>
          <a class="brand" href="#">Xen Orchestra</a>
          <div class="nav-collapse collapse">
            <ul class="nav">
              <li class="active"><a href="#">Home</a></li>
              <li class="dropdown"> <a class="dropdown-toggle" data-toggle="dropdown" href="#">Vm <b class="caret"></b> </a>
		          <ul class="dropdown-menu">
		            <li><a href="#">Add new...</a></li>
		            <li><a href="#">Manage</a></li>
		            <li><a href="#">Templates</a></li>
		            <li><a href="#">List</a></li>
		            <li class="divider"></li>
		            <li><a href="#">Options...</a></li>
		          </ul>
			  </li>
              <li class="dropdown"> <a class="dropdown-toggle" data-toggle="dropdown" href="#">Server <b class="caret"></b> </a>
		          <ul class="dropdown-menu">
		            <li><a href="#">Add new...</a></li>
		            <li><a href="#">Manage</a></li>
		            <li><a href="#">List</a></li>
		            <li class="divider"></li>
		            <li><a href="#">Options...</a></li>
		          </ul>
			  </li>
              <li><a href="#pools">Pool</a></li>
            </ul>
	      <ul class="nav pull-right">
			<li><a href="/users/sign_up">Register</a></li>
			          <li class="divider-vertical"></li>
			          <li class="dropdown">
			            <a class="dropdown-toggle" href="#" data-toggle="dropdown">Log In <strong class="caret"></strong></a>
			            <div class="dropdown-menu" style="padding: 15px; padding-bottom: 0px;">
			              <!-- Login form here -->	      
			              <form action="[YOUR ACTION]" method="post" accept-charset="UTF-8">
  <input id="user_username" style="margin-bottom: 15px;" type="text" name="user[username]" size="30" />
  <input id="user_password" style="margin-bottom: 15px;" type="password" name="user[password]" size="30" />
  <input id="user_remember_me" style="float: left; margin-right: 10px;" type="checkbox" name="user[remember_me]" value="1" />
  <label class="string optional" for="user_remember_me"> Remember me</label>
 
  <input class="btn btn-primary" style="clear: left; width: 100%; height: 32px; font-size: 13px;" type="submit" name="commit" value="Sign In" />
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
