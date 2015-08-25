//Load Facets
//function load_facets

$(document).ready(function(){
    
    //Get index_name from URL
    path_array = window.location.pathname.split('/');
    var index = path_array[1];
    var index_name = path_array[1];
	
    //Define the index and index doc_types here
    var doc_type_dict = {'pubmed': 'aim-core', 'pdb_v2' : 'pdb2' };
    var doc_type = doc_type_dict[index];

    function show_loading() {
        html = "<div class='miniloading'><br><h3>Loading...</h3><br><img src ='../static/ajax_loading_mini.gif'><br><br></div><br>";
        return html;
        }

	//Log any error in console.
    $( document ).ajaxError(function( event, jqxhr, settings, thrownError ) {
        if(settings.error !== undefined) { return; };
        console.log(thrownError);
        console.log(jqxhr);
          });

    
    function get_send_data(query, facets, dragdrop, pageno, search_type)
    {
            
		var send_data = new Object();
			if (parseInt(search_type) == 2)
			{
				send_data.search_string = (eval("("+query+")"));
			}
			else
			{
				send_data.search_string= query;
			}
			
			send_data.facets = [];
			for (c=0; c<facets.length; c++)
			{
				send_data.facets.push(eval("("+facets[c]+")"));
			}
			send_data.dragdrop = [];
			for (c=0; c<dragdrop.length; c++)
			{
				send_data.dragdrop.push(eval("("+dragdrop[c]+")"));
			}
			send_data.pageno = pageno;
			send_data.search_type = search_type;
                 send_data.index = index;
                 send_data.doc_type = doc_type_dict[index];
		return send_data;
    }

	
	function display_document_list(data, class_name)
	{
		doc_list_html = '';
            switch (index) {
                
                case 'pubmed':
                        for (c in data)
                        		{
                        			doc_dict = data[c];
                        			pmid = doc_dict['pmid'];
                        			title = doc_dict['title'];
                        			url_base = "http://ncbi.nlm.nih.gov/pubmed/"+pmid.toString();
                        			doc_list_html += '<li><a class="'+class_name+'" href="'+url_base+'" target="_blank">'+title+'</a></li>';
                        		}  
                break;

                case 'pdb_v2':

                        for (c in data)
                        		{
                        			doc_dict = data[c];
                        			docid = doc_dict['dataItem']['ID'];
                        			title = doc_dict['dataItem']['title'];
                        			url_base = "http://www.rcsb.org/pdb/explore/explore.do?structureId="+docid.toString();
                        			doc_list_html += '<li><a class="'+class_name+'" href="'+url_base+'" target="_blank">'+title+'</a></li>';
                        		}  
                break;

            }
		
		return doc_list_html;
	}
	
	function update_context_menu(id_list)
	{
		id_limit = Math.min(5,id_list.length);
           final_ids = id_list.slice(0,id_limit);
		d_text='Documents Like This';
		child_menus = [];
		c
		$.ajax({
				  url: "/"+ index_name + "/document_list/",
				  method: "POST",
				  dataType:'json',
				  data: {'index': index, 'doc_type': doc_type, 'id-list': JSON.stringify(final_ids)},
				  success: function(data) {
					  update_html = '<li><b>Documents Associated</b><ul>';
					  update_html += display_document_list(data, "menu-links");
					  update_html += '</ul></li>';
					  update_html += "<li data-command='"+JSON.stringify(final_ids)+"' data-values='"+JSON.stringify(final_ids)+"'>"+d_text+"</li>";
					  $("#item-context").html(update_html)
				  }
		});
		return child_menus;
	}
           
    //Highlight Keywords
	function highlight_keywords(id)
	{
		var id_list;
		d3.selectAll(".keyitem").each(function () {
			id_list = d3.select(this).attr("data-elems").split(",");
			if ($.inArray(id, id_list) > -1)
			{
				d3.select(this).classed("keyhighlight", true);
			}
		});
	}
			
			
	//Highlight Filters
	function highlight_filters(id)
	{
		var id_list;
		$('#facet-cloud li').each(function () {
			id_list = $(this).attr("data-elems").split(",");
			if ($.inArray(id, id_list) > -1)
			{
				$(this).addClass("facethighlight");
			}
		});
	}
			
	//Highlight Canvas
	function highlight_canvas(id)
	{
		var id_list;
		d3.selectAll(".cresult").each(function () {
			id_list = d3.select(this).attr("data-elems").split(",");
			if ($.inArray(id, id_list) > -1)
			{
				d3.select(this).classed("chighlight", true);
			}
		});
	}

	//Convert Facet items as drag-n-drop items
    $('#facet-graph').on('mouseover', '#facet-cloud li', function (e) {
        $(this).draggable({opacity: 0.7, helper: "clone", cursor: "move", addClasses: false, distance: 5});
        });

    //Clicking Functions
    $('#facet-graph').on('click', '#facet-cloud li', function (e) {
                
                var key_list;
				//Clear selection in keywords and Canvas
				d3.selectAll(".keyitem").classed("keyselect", false);
				d3.selectAll(".keyitem").classed("keyhighlight", false);
				d3.selectAll(".cresult").classed("cselect", false);
				d3.selectAll(".cresult").classed("cdefault", true);
				d3.selectAll(".cresult").classed("chighlight", false);
				d3.selectAll(".facetitem").classed("facethighlight", false);
                if (e.ctrlKey || e.metaKey) {
                      $(this).toggleClass("facetselect")
					  key_list = $(this).attr('data-elems').split(",");
					  for (i = 0; i < key_list.length; i++) 
					  {
						  highlight_keywords(key_list[i]);
						  highlight_canvas(key_list[i]);
					  }
                 }
                    else
                    {
                         if ($(this).hasClass("facetselect"))
                            {
                                $('#facet-cloud li').removeClass();
                                $('#facet-cloud li').addClass("facetitem hasmenu");
                            }
                        else {
                                $('#facet-cloud li').removeClass();
                                $('#facet-cloud li').addClass("facetitem hasmenu");
                                $(this).toggleClass("facetselect");
								key_list = $(this).attr('data-elems').split(",");
								  for (i = 0; i < key_list.length; i++) 
								  {
									  highlight_keywords(key_list[i]);
									  highlight_canvas(key_list[i]);
								  }
                             }
                        
                    }
            });

			
			

    
	//Create the side menu facets
   function create_facets(data) {
        var facet_array = [];
        $.each(data, function(key,value)
                {
                    var farray = " " +
                    "<ul class='facet-list'><b>"+key.toString()+"</b>";
                    $.each(value['facets'], function(k, v) {
                            farray += '<li><input type="checkbox" class="facetcheck" ';
							if (v['selected'] == 1)
							{
								farray += ' checked ';
							}
							farray += 'data-field="'+ v["field"].toString() +'" data-type="'+ v["type"].toString() +'" name="'+ v["name"].toString() +'" value="'+ v["key_name"].toString() +'"> ' + v["name"].toString() + ' (' + v["count"].toString()+ ')</li>';
                        })
                       farray += "</ul>";
                    facet_array[value['order']] = farray;
                });
            var final_html = "";
            
            $.each(facet_array, function(z,y)
            {
            final_html += y.toString()});
		$('#facet-box').html(final_html);
            
    }

     //Function to generate the side menu facets for the search
    function generate_menu_facets(query, facets, dragdrop, pageno, search_type) {
        $.ajax({
		  url: "/"+ index_name + "/generate_facets/",
		  method: "POST",
		  dataType:'json',
		  data:  JSON.stringify(get_send_data(query, facets, dragdrop, pageno, search_type)),
		  contentType: "application/json; charset=UTF-8",
		 success: function(data) {
				create_facets(data);
			}
		});
    }
	
     //Function to load relevant facets
    function load_relevent_facets(query, facets, dragdrop, pageno, search_type){
        $.ajax({
                    	 url: "/"+ index_name + "/relevant_facets/",
                    	 method: "POST",
                    	 dataType:'json',
                         data:  JSON.stringify(get_send_data(query, facets, dragdrop, pageno, search_type)),
                         contentType: "application/json; charset=UTF-8",
                    	 success: function(data) {
                                    filter_html = '<ul id="facet-cloud">';
                                    frange = [0.75,1.5]
                                    $.each(data, function(key,value) {
                                        fsize = (value["weight"] * (frange[1]-frange[0])) + 0.75;
                                        filter_html += '<li data-type="'+value["type"]+'" data-field="'+value["field"]+'" data-key="'+value["key_name"]+'" data-elems="'+ value["ids"].join(",")+'" id="facet-'+key.toString()+'" data-value="'+value["agg_type"]+': '+value["name"]+'" class="facetitem hasmenu" style="font-size:'+fsize+'em">'+value["agg_type"]+': '+value["name"]+' ('+value["count"]+')</li>';
                                        });
                                    filter_html += '</ul>';
                                    $('#facet-graph').html(filter_html); 
                                    }
                            });
        }

     //function to load keyword cloud
     function load_keyword_cloud(query, facets, dragdrop, pageno, search_type) {
            
                 $.ajax({
                    	  url: "/"+ index_name + "/keywords/",
                    	  method: "POST",
                    	  dataType:'json',
                         data:  JSON.stringify(get_send_data(query, facets, dragdrop, pageno, search_type)),
                         contentType: "application/json; charset=UTF-8",
                    	 success: function(data) {
                $('#keyword-graph').html('<svg  xmlns="http://www.w3.org/2000/svg" id="svg-key" viewBox="0 0 400 400"></svg>');
				var fill = d3.scale.category20();
                var key_list;
                 d3.layout.cloud().size([400, 400])
                  .words(data.map(function(d) {return {text: d.text, size: d.size, ids:d.ids, field:d.field, type:d.type, key_name:d.key_name};}))
                  .rotate(function() { return 0; })
                  .font("helvetica")
                  .fontSize(function(d) { return d.size; })
                  .on("end", draw)
                  .start();


                function draw(words) {
                d3.select("body").select("#keyword-cloud").select("#svg-key")
                    .append("g")
                    .attr("transform", "translate(200,200)")
                    .selectAll("text")
                    .data(words)
                    .enter().append("text")
                    .style("font-size", function(d) { return d.size + "px"; })
                    .style("font-family", function(d) { return d.font; })
                    .attr("text-anchor", "middle")
                    .attr("class", "keyitem hasmenu")
					.attr("data-elems", function(d) {return d.ids;})
                    .attr("data-field", function(d) {return d.field;})
                    .attr("data-type", function(d) {return d.type;})
                    .attr("data-key", function(d) {return d.key_name;})
					.attr("data-value", function(d) {return d.text;})
                    .attr("transform", function(d) {
                      return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                    })
                    .attr("id", function(d,i) { return "keycloud-"+i.toString(); })
                    .text(function(d) { return d.text; })
                    .on("mouseover", function() {
                                                key_var = d3.select(this)[0];
                                                $(key_var).draggable({
                                                            appendTo: 'body', 
                                                            opacity: 0.7, 
                                                            helper: function(){
                                                                    
                                                                    return $("<div>"+$(this).text()+"</div>");
                                                                        },
                                                            cursor: "move", 
                                                            addClasses: false,
                                                            distance: 5});
                                                 })
                              
                    .on("click", function(d,i) {
						d3.selectAll(".facetitem").classed("facetselect", false);
						d3.selectAll(".facetitem").classed("facethighlight", false);
						d3.selectAll(".cresult").classed("cselect", false);
						d3.selectAll(".cresult").classed("cdefault", true);
						d3.selectAll(".keyitem").classed("keyhighlight", false);
						d3.selectAll(".cresult").classed("chighlight", false);
                                  multi_select = false;
                            if (d3.event != null)
                                    {
                                    if (d3.event.ctrlKey || d3.event.metaKey) {
                                               d3.select(this).classed("keyselect", ! d3.select(this).classed("keyselect"));
            										 key_list = d3.select(this).attr('data-elems').split(",");
            										  for (i = 0; i < key_list.length; i++) 
            										  {
            											  highlight_filters(key_list[i]);
            											  highlight_canvas(key_list[i]);
            										  }
                                                multi_select = true;
                                                }
                                    }
                             if (multi_select != true)
                                {
                                    if (d3.select(this).classed("keyselect"))
									{
										d3.selectAll(".keyitem").classed("keyselect", false);
									}
									else
									{
										d3.selectAll(".keyitem").classed("keyselect", false);
										d3.select(this).classed("keyselect", true);
										key_list = d3.select(this).attr('data-elems').split(",");
										  for (i = 0; i < key_list.length; i++) 
										  {
											  highlight_filters(key_list[i]);
											  highlight_canvas(key_list[i]);
										  }
									}
                                     
                                }
							});
						  }
						}
					  
				});
			}

    
     //Generate Document graph
    function generate_document_graph(query, facets, dragdrop, pageno, search_type) {
            $.ajax({
                    	  url: "/"+ index_name + "/document_graph/",
                    	  method: "POST",
                    	 data:  JSON.stringify(get_send_data(query, facets, dragdrop, pageno, search_type)),
                         contentType: "application/json; charset=UTF-8",
                    	 success: function(data) {
                            $("#document-graph").html(data);
                                d3.select("body").select("#document-cluster").select("#svg-obj").selectAll(".cresult").on("click", function() {
                			var key_list;
                			d3.selectAll(".facetitem").classed("facetselect", false);
                			d3.selectAll(".facetitem").classed("facethighlight", false);
                			d3.selectAll(".keyitem").classed("keyhighlight", false);
                			d3.selectAll(".keyitem").classed("keyselect", false);
                			d3.selectAll(".cresult").classed("chighlight", false);
                			if (d3.event.ctrlKey || d3.event.metaKey) {
                                d3.select(this).classed("cselect", ! d3.select(this).classed("cselect"));
                				d3.select(this).classed("cdefault", ! d3.select(this).classed("cdefault"));
                				key_list = d3.select(this).attr('data-elems').split(",");
                					
                					  for (i = 0; i < key_list.length; i++) 
                					  {
                						  highlight_filters(key_list[i]);
                						  highlight_keywords(key_list[i]);
                					  }
                                }
                			else
                				{
                					if (d3.select(this).classed("cselect"))
                					{
                						d3.selectAll(".cresult").classed("cselect", false);
                						d3.selectAll(".cresult").classed("cdefault", true);
                					}
                					else
                					{
                						d3.selectAll(".cresult").classed("cselect", false);
                						d3.selectAll(".cresult").classed("cdefault", true);
                						d3.select(this).classed("cdefault", false);
                						d3.select(this).classed("cselect", true);
                						key_list = d3.select(this).attr('data-elems').split(",");
                					
                						  for (i = 0; i < key_list.length; i++) 
                						  {
                							  highlight_filters(key_list[i]);
                							  highlight_keywords(key_list[i]);
                						  }
                					}
                					 
                				}
                
                    		});

                        }
                });
        }



     function generate_pages(total_hits, current_page) {
		 total_hits = parseInt(total_hits);
		 total_pages = Math.ceil(total_hits/10);
		 
		 current_page = parseInt(current_page);
		 pagination_text = '';
         if (total_pages > 1)
		 {
			 pagination_text = '<ul class="page-list">';
			 start_page = Math.max(1,current_page-2);
			 end_page = Math.min(start_page+4, total_pages);
			 
			 if (current_page > start_page)
				{
					pagination_text += '<li class="page-digit"><a class="page-links" data-to="'+(current_page-1)+'"><b><<</b></a></li>';
				}
			 for (c=start_page; c<=end_page; c++)
				{
					if (c==current_page)
						{
							pagination_text += '<li class="page-digit current-page" id="current_page" data-to="'+c+'"><b>'+c+'</b></li>';
						}
					else 
						{
							pagination_text += '<li class="page-digit"><a class="page-links"  data-to="'+c+'">'+c+'</a>';
						}
				}
			if (end_page < total_pages)
				{pagination_text += '<li class="page-digit"><a class="page-links" data-to="'+(current_page+1)+'"><b>>></b></a></li>';}
			 pagination_text += '</ul>'; 
			 
		}
		$('#pagination').html(pagination_text);
     }
	 
	 function display_text_results(data, pageno)
	 {
		 var first_text = "";
			var other_text = "";
			$('#search-count').html(data['total_hits']);
			$.each(data['results'], function(key,value) {
				pub = value['_source'];
                        
                    switch (index) {
                        case 'pubmed':
                                    var journal_text = "";
            				 var mesh_text = "MeSH : ";
            					for (i = 0; i < pub['article_type'].length; i++) { 
            									journal_text += pub['article_type'][i].toString() + " | ";
            								}
            					for (i = 0; i < pub['mesh'].length; i++) { 
            									mesh_text += pub['mesh'][i].toString() + " | ";
            								}
            				out_text = "<span class='result-title' data-id='"+key.toString()+"'>" +
            		  "<a class='result-links' target='_blank' href='http://ncbi.nlm.nih.gov/pubmed/"+pub['pmid'].toString()+"'>" + 
            				 "" + pub['title'].toString()+"</a>" +
            		   "</span><br>" + 
            		   "<span class='result-url' data-id='"+key.toString()+"'>"+pub['journal_title'].toString()+". "+pub['year'].toString()+";"+pub['journal_volume'].toString()+"("+pub['journal_issue'].toString()+"):"+pub['journal_page'].toString()+"</span><br>"+
            		  "<span class='result-description' data-id='"+key.toString()+"'>"+pub['abstract'].toString().substring(0,500)+"</span><br>"+
            		  "<span class='result-metadata' data-id='"+key.toString()+"'>PMID:"+pub['pmid'].toString()+" - "+journal_text+"<br>"+mesh_text+"</span>" +
            				 "<br><br>";
            						
            					
                            break;
                        case 'pdb_v2':
                                    
                                    var organism_text = "";
            				 var key_text = "Keywords : ";
                                    var material_text = "Materials : ";
                                       if (typeof  pub['organism'] !== 'undefined')
            					{ 
                                        if (typeof pub['organism']['host'] !== 'undefined' && pub['organism']['host'].length > 0) {
                                                   for (i = 0; i < pub['organism']['host'].length; i++) { 
                                                              if (typeof pub['organism']['host'][i]['genus'] !== 'undefined')
                                                                        {organism_text += pub['organism']['host'][i]['genus'].toString() + " | "; }
            								}
                                                }
                                        
                                        if (typeof pub['organism']['source'] !== 'undefined' && pub['organism']['source'].length > 0) {
                                                   for (i = 0; i < pub['organism']['source'].length; i++) { 
                                                            if (typeof pub['organism']['source'][i]['genus'] !== 'undefined')
            									{organism_text += pub['organism']['source'][i]['genus'].toString() + " | ";}
            								}
                                                }
                                        }

                                        if (typeof pub['dataItem']['keywords'] !== 'undefined' && pub['dataItem']['keywords'].length > 0) {
                                                   for (i = 0; i < pub['dataItem']['keywords'].length; i++) { 
            									key_text += pub['dataItem']['keywords'][i].toString() + " | ";
            								}
                                                }
            					
                                        if (typeof pub['materialEntity'] !== 'undefined' && pub['materialEntity'].length > 0) {
                                                   for (i = 0; i < pub['materialEntity'].length; i++) { 
            									material_text += pub['materialEntity'][i]['name'].toString() + " | ";
            								}
                                                }
                                        
            				out_text = "<span class='result-title' data-id='"+key.toString()+"'>" +
                                    		  "<a class='result-links' target='_blank' href='http://www.rcsb.org/pdb/explore/explore.do?structureId="+pub['dataItem']['ID'].toString()+"'>" + 
                                    				 "" + pub['dataItem']['title'].toString()+"</a>" +
                                    		   "</span><br>" + 
                                                 "<span class='result-description'>"+pub['dataItem']['description'].toString().substring(0,500)+"</span><br>"+
                                                    "<div class='result-subbox'><a class='result-sublinks' target='_blank' href='http://ncbi.nlm.nih.gov/pubmed/"+pub['citation']['PMID']+"'>" + 
                                				 "" + pub['citation']['title'].toString()+"</a><br>" +
                                    		   "<span class='result-url' data-id='"+key.toString()+"'>"+pub['citation']['journal']+". "+pub['citation']['year']+"; pages: ";
                                                if (typeof pub['citation']['firstPage'] !== 'undefined') 
                                                     {out_text += pub['citation']['firstPage'].toString()+"-"}
                                                if (typeof pub['citation']['lastPage'] !== 'undefined') 
                                                     {out_text += "-"+pub['citation']['lastPage'].toString()}
                                    out_text += "</span></div>"+
                                    		  "<span class='result-metadata' data-id='"+key.toString()+"'>ID:"+pub['dataItem']['ID'].toString()+" - "+organism_text+"<br>"+key_text+"<br>"+material_text+"<br>"+"</span>" +
                                    				 "<br><br>";

                            break;
                    }
				if ((parseInt(key.toString()) == 1)&&(parseInt(pageno)==1))
            					{
                                     first_text = out_text;
            						$("#top-most").html(first_text);
            					}
            					else {
            							other_text += out_text;
            					}
            				});
			$('#other-results').html(other_text);
			generate_pages(data['total_hits'], data['pageno']);
	 }
	 

     function send_search(query, facets, dragdrop, pageno, search_type){
        $('#facet-box').html(show_loading());
        $("#top-most").html(show_loading());
        $('#other-results').html(show_loading());
        $('#facet-graph').html(show_loading());
        $("#document-graph").html(show_loading());
        d3.select("body").select("#keyword-cloud").select("#svg-key").selectAll("*").remove();
        $('#keyword-graph').html(show_loading());
        if (search_type==null)
			{
				search_type = $("#document-search").val();
			}
		if (parseInt(search_type)==2)
		{
			query = $("#document-search").attr('data-value');
		}
        $.ajax({
                    	  url: "/"+ index_name + "/search_query/",
                         //url: "/search_query/",
                    	  method: "POST",
                    	  dataType:'json',
                         data:  JSON.stringify(get_send_data(query, facets, dragdrop, pageno, search_type)),
                         contentType: "application/json; charset=UTF-8",
                         success: function(data) {
                                    display_text_results(data, pageno);
                                },
						 beforeSend: function() {
										generate_menu_facets(query, facets, dragdrop, pageno, search_type);
										load_relevent_facets(query, facets, dragdrop, pageno, search_type);
										generate_document_graph(query, facets, dragdrop, pageno, search_type);
										load_keyword_cloud(query, facets, dragdrop, pageno, search_type);
										}
                            });
         }
     
	function goto_page(query, facets, dragdrop, pageno, search_type){
		$('#other-results').html(show_loading());
		$.ajax({
                    	  url: "/"+ index_name + "/search_query/",
                    	  method: "POST",
                    	  dataType:'json',
                         data:  JSON.stringify(get_send_data(query, facets, dragdrop, pageno, search_type)),
                         contentType: "application/json; charset=UTF-8",
                         success: function(data) {
                                    display_text_results(data,pageno);
						}
					});
	}
	
    function process_search_query (){
            var search_string = $("#search-field").val().trim();
            if (search_string != null && search_string != '') 
                {
                    $("#search-field").attr('data-value', search_string);
					$("#document-search").attr('data-value', '');
					$("#document-search").val('1');
					$('#search-drop').html("");
					$("#document-search-indication").html("");
					$("#document-search-indication").css("display", "none");
                    send_search(search_string, '', '', 1, 1);
                }
            }

    function get_selected_facets () {
             checked_facets = [];
         $('.facetcheck').each(function(){
                if ($(this).prop('checked'))
                {
                    field = $(this).attr('data-field');
                        type = $(this).attr('data-type');
                        key_name = $(this).attr('value');
                        var obj = new Object();
                        if (type == 'terms')
                        {
                            obj.terms = new Object();
                            obj.terms[field]  = [key_name];
                        }
                        
                        if (type == 'range')
                        {
                            obj.range = new Object();
                            obj.range[field]  = eval("("+key_name+")");
                        }
                        var jsonobj= JSON.stringify(obj);
                        checked_facets.push(jsonobj)
                }
            });
      return checked_facets;
    }



    function get_drag_drops () {
        dropped_items = [];
         $('#search-drop .filter-item').each(function(){
                    field = $(this).attr('data-field');
                        type = $(this).attr('data-type');
                        key_name = $(this).attr('data-key');
                        var obj = new Object();
                        if (type == 'terms')
                        {
                            obj.terms = new Object();
                            obj.terms[field]  = [key_name];
                        }
                        var jsonobj= JSON.stringify(obj);
                       dropped_items.push(jsonobj)
            });
      return dropped_items;
    }

    //Display search on clicking
    $('#search-button').click(function () {
            process_search_query();
            });

   //Display search on press Enter
    $('#search-field').keypress(function (e) {
      if (e.which == 13) {
        process_search_query();
        return false;
      }
    });

	//Documents like this search
	function documents_like_this(final_ids){
		$("#search-field").attr('data-value', '');
		$("#search-field").val('');
		$("#document-search").attr('data-value', final_ids);
		$("#document-search").val('2');
		$('#search-drop').html("");
		doc_list_display = '';
		$.ajax({
                	  url: "/"+ index_name + "/document_list/",
                	  method: "POST",
                	  dataType:'json',
                	  data: {'index': index, 'doc_type': doc_type, 'field-type': 'title', 'id-list': final_ids},
                	  success: function(data) {
								doc_list_display = '<ul class="search-doc-list">'
								doc_list_display += display_document_list(data, "search-doc-links");
								doc_list_display += '</ul>';
                             
							$("#document-search-indication").html("<p>You are viewing results of documents like search based on: "+doc_list_display);
						},
                  });  
		$("#document-search-indication").css("display", "table-cell");
		send_search(final_ids, '', '', 1 , 2);
	}

	//On click of page
	$('#pagination').on('click', 'a', function(){
		clicked_page = $(this).attr('data-to');
		facets = get_selected_facets();
        dragdrop = get_drag_drops();
        query = $("#search-field").attr('data-value');
		pageno = parseInt(clicked_page);
		search_type = $("#document-search").val();
		goto_page(query, facets, dragdrop, pageno, search_type);
	});
	
    //Facets Filtering from side menu - on selecting a checkbox - activate search
    $('#facet-box').on('change', '.facetcheck', function() {
        facets = get_selected_facets();
        dragdrop = get_drag_drops();
        query = $("#search-field").attr('data-value');
		search_type = $("#document-search").val();
        send_search(query, facets, dragdrop, 1, search_type)
    });


	function drop_item(element,destination)
        {
            drop_elem = '<div class="filter-item" data-type="'+element.attr('data-type')+'" data-field="'+element.attr('data-field')+'" data-key="'+element.attr('data-key')+'">'+element.attr('data-value')+'<span class="del-button">x</span></div>';
			dvalue = element.attr('data-value');
			if ((destination).find('.filter-item[data-value="'+dvalue+'"]').length) {
				//Element already dragged.. do nothing
			}
			else {
				destination.append(drop_elem);
				facets = get_selected_facets();
				dragdrop = get_drag_drops();
				query = $("#search-field").attr('data-value');
				search_type = $("#document-search").val();
				send_search(query, facets, dragdrop, 1, search_type)
			}
            
        }
		
    //On drag-drop an item, activate search
     $('#search-drop').droppable({drop: function( event, ui ) {
        dragged = ui.draggable;
        drop_item(dragged,$(this));
      }});

    //On clicking x button, Remove drag-drop element, and then redo the search
    $('#search-drop').on('click', '.del-button', function(e) {
            $(this).parent().remove();
			facets = get_selected_facets();
			dragdrop = get_drag_drops();
			query = $("#search-field").attr('data-value');
			send_search(query, facets, dragdrop, 1)
        });
		
	//Attach Context Menu - Right Click
		$(document).contextmenu({
			delegate: ".hasmenu",
			menu: [{title: "Documents Associated", cmd:"dlist", children:
						[]
					},
					{title: "Documents Like This" , cmd: "dlt"}
				],
			beforeOpen: function(event, ui) {
						$target = ui.target;
						
						id_list = $target.attr("data-elems").split(",");
						id_limit = Math.min(5,id_list.length);
						final_ids = id_list.slice(0,id_limit);
						var doc_ids = JSON.stringify(final_ids);
						$.ajax({
								  url: "/"+ index_name + "/document_list/",
								  method: "POST",
								  dataType:'json',
								  data: {'index': index, 'doc_type': doc_type, 'field-type': 'title', 'id-list': doc_ids},
								  success: function(data) {
									  child_docs = []
                                                        switch (index) {
                
                                                                case 'pubmed':
                                                                        for (c in data)
                                                                        		{
                                                                                     var child_item = new Object();       
                                                                        			doc_dict = data[c];
                                                                        			pmid = doc_dict['pmid'];
                                                                        			title = doc_dict['title'];
                                                                        			url_base = "http://ncbi.nlm.nih.gov/pubmed/"+pmid.toString();
                                                                        			child_item.title='<a class="menu-links" href="'+url_base+'" target="_blank">'+title+'</a>';
                                                                                      child_docs.push(child_item);
                                                                        		}  
                                                                break;
                                                
                                                                case 'pdb_v2':
                                                
                                                                        for (c in data)
                                                                        		{
                                                                                     var child_item = new Object();
                                                                        			doc_dict = data[c];
                                                                        			docid = doc_dict['dataItem']['ID'];
                                                                        			title = doc_dict['dataItem']['title'];
                                                                        			url_base = "http://www.rcsb.org/pdb/explore/explore.do?structureId="+docid.toString();
                                                                        			child_item.title='<a class="menu-links" href="'+url_base+'" target="_blank">'+title+'</a>';
                                                                            		child_docs.push(child_item);
                                                                                    }  
                                                                break;
                                                
                                                            } 	
									  $(document).contextmenu("setEntry", "dlist", {title: "Documents Associated", children: child_docs});
								  }
						});
					},
			select: function (event, ui) {
				
				$target = ui.target;
				
				if (ui.cmd == 'dlt')
				{
					id_list = $target.attr("data-elems").split(",");
					id_limit = Math.min(5,id_list.length);
					final_ids = id_list.slice(0,id_limit);
					var doc_ids = JSON.stringify(final_ids);
					
					documents_like_this(doc_ids);
				}
			}
		});

});