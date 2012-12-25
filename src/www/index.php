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
		            <li><a href="#"><i class="icon-reorder"></i> List</a></li>
		            <li><a href="#"><i class="icon-plus"></i> Add new...</a></li>
		            <li><a href="#"><i class="icon-cog"></i> Manage</a></li>
		            <li><a href="#"><i class="icon-file"></i> Templates</a></li>
		            <li class="divider"></li>
		            <li><a href="#"><i class="icon-wrench"></i> Options...</a></li>
		          </ul>
			  </li>
              <li class="dropdown"> <a class="dropdown-toggle" data-toggle="dropdown" href="#"><i class="icon-reorder"></i> Server <b class="caret"></b> </a>
		          <ul class="dropdown-menu">
		            <li><a href="#"><i class="icon-reorder"></i> List</a></li>
		            <li><a href="#"><i class="icon-plus"></i> Add new...</a></li>
		            <li><a href="#"><i class="icon-cog"></i> Manage</a></li>
		            <li class="divider"></li>
		            <li><a href="#"><i class="icon-wrench"></i> Options...</a></li>
		          </ul>
			  </li>
              <li class="dropdown"> <a class="dropdown-toggle" data-toggle="dropdown" href="#"><i class="icon-cloud"></i> Pool <b class="caret"></b> </a>
		          <ul class="dropdown-menu">
		            <li><a href="#"><i class="icon-reorder"></i> List</a></li>
		            <li><a href="#"><i class="icon-plus"></i> Add new...</a></li>
		            <li><a href="#"><i class="icon-cog"></i> Manage</a></li>
		            <li class="divider"></li>
		            <li><a href="#"><i class="icon-wrench"></i> Options...</a></li>
		          </ul>
			  </li>
			  <li class="divider-vertical"></li>              
              <li><a href="#pools"><i class="icon-wrench"></i> Admin</a></li>
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

<div class="leaderboard">  
<h1>Welcome on XO!</h1>  
<p>Add an XCP host or a Pool master, and start to use the magic of Xen Orchestra.</p>  
<p><a class="btn btn-success btn-large"><i class="icon-magic"></i>  Let's go!</a></p>  
</div>

<div class="row">  
<div class="span4">  
<h2>Todo</h2>  
<p>    
	<ul class="unstyled">
		<li><i class="icon-ok"></i> Add a single server or a pool master</li>
		<li><i class="icon-ok"></i> Add or Edit users</li>
		<li><i class="icon-ok"></i> Add or Edit VM</li>
	</ul>
</p>  
<p><a class="btn btn-info btn-large" href="#"><i class="icon-info-sign"></i> Learn more</a></p>  
</div>  
<div class="span4">  
<h2>Get involved!</h2>  
<p>Go to our GitHub page and get involved in the project!</p>  
<p><a class="btn btn-success btn-large" href="#"><i class="icon-beaker"></i> Project page</a></p>  
</div>  
<div class="span4">  
<h2>Who we are?</h2>  
<p>We are Vates!</p>  
<p><a class="btn btn-large" href="#"><i class="icon-circle-arrow-right"></i> Go on our website!</a></p>  
</div>  
</div>  



<div class="modal hide fade" id="infos">
  <div class="modal-header"> <a class="close" data-dismiss="modal">×</a>
    <h3>Initial configuraton</h3>
  </div>
  <div class="modal-body">
    <p>Please add a XCP server or a Pool master.</p>
  </div>
  <div class="modal-footer"> <a class="btn btn-info" data-dismiss="modal">Close</a> </div>
</div>
<a class="btn btn-info" data-toggle="modal" href="#infos" ><i class="icon-info-sign"></i> Initial configuration</a>



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
