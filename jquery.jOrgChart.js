/**
 * jQuery org-chart/tree plugin.
 *
 * Author: Wes Nolte
 * http://twitter.com/wesnolte
 *
 * Based on the work of Mark Lee
 * http://www.capricasoftware.co.uk
 *
 * Copyright (c) 2011 Wesley Nolte
 * Dual licensed under the MIT and GPL licenses.
 *
 */
(function($) {

    $.fn.jOrgChart = function(options) {
        var opts = $.extend({ }, $.fn.jOrgChart.defaults, options),
            $appendTo = $(opts.chartElement),
            $this = $(this),
            $container = $("<div class='" + opts.chartClass + "'/>");

        // build the tree
        if ($this.is("ul")) {
            buildNode($this.find("li:first"), $container, 0, opts);
        } else if ($this.is("li")) {
            buildNode($this, $container, 0, opts);
        }

        $appendTo.append($container);

        // add drag and drop if enabled
        if (opts.dragAndDrop) {

            $('div.node').draggable({
                cursor: 'move',
                distance: 40,
                helper: 'clone',
                opacity: 0.8,
                revert: 'invalid',
                revertDuration: 100,
                snap: 'div.node.expanded',
                snapMode: 'inner',
                stack: 'div.node'
            }).droppable({
                accept: '.node',
                activeClass: 'drag-active',
                hoverClass: 'drop-hover'
            }).bind("dragstart", function() {

                // Drag start event handler for nodes
                var sourceNode = $(this);
                sourceNode.parentsUntil('.node-container')
                    .find('*')
                    .filter('.node')
                    .droppable('disable');

            }).bind("dragstop", function() {

                // Drag stop event handler for nodes
                /* reload the plugin */
                $(opts.chartElement).children().remove();
                $this.jOrgChart(opts);

            }).bind("drop", function(event, ui) {

                // Drop event handler for nodes
                var targetId = $(this).data("tree-node"),
                    targetLi = $this.find("li").filter(function() { return $(this).data("tree-node") === targetId; }),
                    targetUl = targetLi.children('ul'),
                    sourceId = ui.draggable.data("tree-node"),
                    sourceLi = $this.find("li").filter(function() { return $(this).data("tree-node") === sourceId; }),
                    sourceUl = sourceLi.parent('ul');

                if (targetUl.length > 0) {
                    targetUl.append(sourceLi);
                } else {
                    targetLi.append("<ul></ul>");
                    targetLi.children('ul').append(sourceLi);
                }

                //Removes any empty lists
                if (sourceUl.children().length === 0) {
                    sourceUl.remove();
                }

            });

        } // Drag and drop
    };

    // Option defaults
    $.fn.jOrgChart.defaults = {
        chartElement: 'body',
        depth: -1,
        chartClass: "jOrgChart",
        dragAndDrop: false,
        clicktoHide: true
    };

    var nodeCount = 0;

    // Method that recursively builds the tree
    function buildNode($node, $appendTo, level, opts) {
        var $table = $("<table cellpadding='0' cellspacing='0' border='0'/>"),
            $tbody = $("<tbody/>"),
            // Construct the node container(s)
            $nodeRow = $("<tr/>").addClass("node-cells"),
            $nodeCell = $("<td/>").addClass("node-cell").attr("colspan", 2),
            $childNodes = $node.children("ul:first").children("li"),
            $nodeDiv;

        if ($childNodes.length > 1) {
            $nodeCell.attr("colspan", $childNodes.length * 2);
        }
        // Draw the node
        // Get the contents - any markup except li and ul allowed
        var $nodeContent = $node.clone()
            .children("ul,li")
            .remove()
            .end()
            .html();

        //Increaments the node count which is used to link the source list and the org chart
        nodeCount++;
        $node.data("tree-node", nodeCount);
        $nodeDiv = $("<div>").addClass("node")
            .data("tree-node", nodeCount)
            .append($nodeContent);

        // Expand and contract nodes
        if (opts.clicktoHide && $childNodes.length > 0) {
            $nodeDiv.click(function() {
                var $this = $(this),
                    $tr = $this.closest("tr");

                if ($tr.hasClass('contracted')) {
                    $this.css('cursor', 'n-resize');
                    $tr.removeClass('contracted').addClass('expanded');
                    $tr.nextAll("tr").css('visibility', '');

                    // Update the <li> appropriately so that if the tree redraws collapsed/non-collapsed nodes
                    // maintain their appearance
                    $node.removeClass('collapsed');
                } else {
                    $this.css('cursor', 's-resize');
                    $tr.removeClass('expanded').addClass('contracted');
                    $tr.nextAll("tr").css('visibility', 'hidden');

                    $node.addClass('collapsed');
                }
            }).css('cursor', 'n-resize');
        }

        $nodeCell.append($nodeDiv);
        $nodeRow.append($nodeCell);
        $tbody.append($nodeRow);

        if ($childNodes.length > 0) {

            // recurse until leaves found (-1) or to the level specified
            if (opts.depth == -1 || (level + 1 < opts.depth)) {
                var $downLineRow = $("<tr/>"),
                    $downLineCell = $("<td/>").attr("colspan", $childNodes.length * 2),
                    $downLine = $("<div></div>").addClass("line down");

                $downLineRow.append($downLineCell);
                // draw the connecting line from the parent node to the horizontal line
                $downLineCell.append($downLine);

                $tbody.append($downLineRow);

                // Draw the horizontal lines
                var $linesRow = $("<tr/>");
                $childNodes.each(function() {
                    var $left = $("<td>&nbsp;</td>").addClass("line left top");
                    var $right = $("<td>&nbsp;</td>").addClass("line right top");
                    $linesRow.append($left).append($right);
                });

                // horizontal line shouldn't extend beyond the first and last child branches
                $linesRow.find("td:first")
                    .removeClass("top")
                    .end()
                    .find("td:last")
                    .removeClass("top");

                $tbody.append($linesRow);

                var $childNodesRow = $("<tr/>");
                $childNodes.each(function() {
                    var $td = $("<td class='node-container'/>");
                    $td.attr("colspan", 2);
                    // recurse through children lists and items
                    buildNode($(this), $td, level + 1, opts);
                    $childNodesRow.append($td);
                });

                $tbody.append($childNodesRow);
            }
        }

        // any classes on the LI element get copied to the relevant node in the tree
        // apart from the special 'collapsed' class, which collapses the sub-tree at this point
        if ($node.attr('class') != undefined) {
            var classList = $node.attr('class').split(/\s+/);
            $.each(classList, function(index, item) {
                if (item == 'collapsed') {
                    $nodeRow.nextAll('tr').css('visibility', 'hidden');
                    $nodeRow.removeClass('expanded');
                    $nodeRow.addClass('contracted');
                    $nodeDiv.css('cursor', 's-resize');
                } else {
                    $nodeDiv.addClass(item);
                }
            });
        }

        $table.append($tbody);
        $appendTo.append($table);

        if (opts.clicktoHide) {
            /* Prevent trees collapsing if a link inside a node is clicked */
            $nodeDiv.children('a').click(function(e) {
                e.stopPropagation();
            });
        }
    }

})(jQuery);