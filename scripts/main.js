/*
*  MokuWiki v0.2
*
*   Copyright (c) 2011 Severin Schols
*    Licensed under the MIT license. See LICENSE.markdown for details.
*/

/* BEGIN Configuration */
var config = {
  name: "MokuWiki",
  default_page: "home"
}
/* END Configuration */

/* BEGIN Page class */
/**
    Creates a new MokuWiki Page.
    @class Represents a MokuWiki page. 
 */ 
function Page(name) {
  this.name = name
  this.title = name;
  this.hasOwnTitle = false;
  //this.tiddlyIO = new TiddlyIO();
  //this.converter = new Showdown.converter();
  this.text = '';
  
  this.creole = new Parse.Simple.Creole( {
        forIE: document.all,
        interwiki: {
            Wikipedia: 'http://web.archive.org/web/20091116200910/http://en.wikipedia.org//wiki/'
        },
        linkFormat: '?page='
    } );
  
  this.path = "data/" + this.name + ".txt";
}

Page.prototype.buildLocalPath = function () {
  var localPath = this.tiddlyIO.localPath;
  if((p = localPath.lastIndexOf("/")) != -1)
    this.localPath = localPath.substr(0,p) + "/";
  else if((p = localPath.lastIndexOf("\\")) != -1)
    this.localPath = localPath.substr(0,p) + "\\";
  else
    this.localPath = localPath + ".";
  this.localPath += "data" + this.tiddlyIO.separator + this.name + ".txt";
}

/* page.load(): Load the page from the file system */
Page.prototype.load = function () {
  var obj = this;
  
  $.ajax({
    url: this.path,
	async: false,
	dataType: "text",
	success:  function (data) {
        obj.setText( data );
	  },
	error:  function () {
	    if (!obj.tiddlyIO) {
		  obj.tiddlyIO = new TiddlyIO();
		  obj.buildLocalPath();
		}
	    obj.setText( obj.tiddlyIO.loadFile(obj.localPath) );
	  }
	});
}

/* page.save(): Save the page to the file system */
Page.prototype.save = function () {
  if (!this.tiddlyIO) {
    this.tiddlyIO = new TiddlyIO();
	this.buildLocalPath();
  }
  var output = this.tiddlyIO.saveFile(this.localPath, this.text);
  return output;
}

/* page.getHTML(): Runs Markdown interpreter over the page content and returns the resulting HTML */
Page.prototype.getHTML = function () {
  var output;
  if (this.text != null) {
    var text = this.text.replace(/^=[^=\n]+/, ""); //Remove first headline from text
    output = this.creole.parse(text);
  } else {
    output = "Error: Page is empty!<br/>Maybe you didn't create it yet?";
  }
  return output;
}

/* page.setText(text): Set Text and update page title */
Page.prototype.setText = function (text) {
  if (typeof text != "string") {
    this.text = null;
    return;
  }	
  // Change Linebreaks to CRLF, for crosscompatibility
  text = text.replace(/\r\n/gi, "\n");
  text = text.replace(/\n/gi, "\r\n");
  
  this.text = text;
  
  // Find page title
  var headlinePattern = /^=([^=\n]+)/;
  var match = headlinePattern.exec(this.text);
  if (match === null) {
    this.title = this.name
    this.hasOwnTitle = false;
  } else {
    this.title = match[1];
    this.hasOwnTitle = true;
  }
}
/* END Page class */

  $(document).ready(function() { 
    // jQuery textarea resizer plugin usage
    $('textarea.resizable:not(.processed)').TextAreaResizer();
    
     // Set wiki name
    $('#wiki_name').html(config.name);

    // Determine page title
    var page_title = config.default_page;
    if ($.getURLParam("page") != null) {
      page_title = $.getURLParam("page");
    }

    // Load given page from file
    var page = new Page(page_title);
    page.load();

    // Insert page contents into site
    $('#page_title').html(page.title);
    $('#page_content').html(page.getHTML());
    $('#page_content_edit').html(page.text);
    document.title = config.name + " - " + page.title;

    // Save page
    $('#page_content_edit_save').click(function(event) {
      event.preventDefault();
	  var text = $('#page_content_edit').val()
      page.setText( text );
      var r = page.save();
      if (r) {
        $('#page_content').html(page.getHTML());
        $('#page_title').html(page.title);
        document.title = config.name + " - " + page.title;
      } else {
        alert("Error while saving");
      }
	  $('#page_content_editor').slideUp('slow');
	  $('#page_content_edit_bar').slideDown();
    });
	
	// Cancel Editing
	$('#page_content_edit_cancel').click(function(event) {
	  $('#page_content_edit').html(page.text);
	  $('#page_content_editor').slideUp('slow');
	  $('#page_content_edit_bar').slideDown();
	});
	
	// Open Editor
	$('#page_content_edit_start').click(function(event) {
	  $('#page_content_edit_bar').slideUp();
	  $('#page_content_editor').slideDown('slow');
	});
  });
