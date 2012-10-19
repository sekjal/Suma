var BarChart = function () {
    var width = 550,
        height = 300;

    function chart(selection) {
        selection.each(function (data) {
            var ann,
                g,
                gEnter,
                line,
                rects,
                rule,
                rLine,
                svg,
                text,
                x;

            // Define scales
            x = d3.scale.linear()
                        .domain([0, d3.max(data.map(function (d) {return d.count; }))])
                        .range([0, 380]);

            // Select svg container and join data
            svg = d3.select(this).selectAll('svg').data([data]);

            // Enter svg and append g wrapper
            gEnter = svg.enter().append('svg').append('g').attr('class', 'test');

            // Set width and height of chart
            svg.attr('width', width)
                    .attr('height', height);

            // Update inner dimensions
            g = svg.select('g')
                   .attr('transform', 'translate(150,15)');

            // Append rectangles
            rects = g.selectAll('rect').data(data);

            // Enter
            rects.enter()
                .append('rect')
                .attr('class', 'rect')
                .style('fill', 'steelblue');

            // Update
            rects.transition().duration(500)
                .attr('width', 0)
                .attr('y', function (d, i) {return 25 * i; })
                .attr('height', '20')
                .attr('data', function (d) {return d.count; })
                .transition().delay(750).duration(500)
                .attr('width', function (d, i) {return x(d.count); });

            // Exit
            rects.exit()
                .transition().duration(500)
                .attr('width', 0)
                .remove();

            // Bar annotation
            ann = g.selectAll('.ann').data(data);

            // Enter
            ann.enter()
                .append('text')
                .attr('class', 'ann')
                .style('fill', 'white')
                .style('font-size', '10px')
                .style('font-family', 'Verdana');

            // Update
            ann.style('opacity', 0.000001)
                .attr('x', function (d) {return x(d.count); })
                .attr('dx', '-3')
                .attr('dy', '.35em')
                .attr('text-anchor', 'end')
                .attr('y', function (d, i) {return 25 * i + 12; })
                .text(function (d, i) {return Math.round(d.count); })
                .transition().delay(750).duration(1000)
                .style('opacity', 1);

            // Exit
            ann.exit()
                .style('opacity', 0.000001)
                .remove();

            // Bar labels
            text = svg.selectAll('.barLabel').data(data);

            text.enter()
                .append('text')
                .attr('class', 'barLabel')
                .style('font-size', '12px')
                .style('font-family', 'Verdana');

            text.style('opacity', 0.000001)
                .attr('x', 10)
                .attr('y', function (d, i) {return 25 * i + 30; })
                .attr('dy', -3)
                //.attr('text-anchor', 'left')
                .text(function (d, i) {return d.name; })
                .transition().delay(750).duration(1000)
                .style('opacity', 1);

            text.exit()
                .style('opacity', 0.000001)
                .remove();

            // Append line labels
            rule = g.selectAll('.rule').data(x.ticks(4));

            rule.enter().append('text')
                .attr('class', 'rule')
                .style('font-size', '12px')
                .style('font-family', 'Verdana');

            rule.style('opacity', 0.000001)
                .attr('x', x)
                .attr('y', 0)
                .attr('dy', -3)
                .attr('text-anchor', 'middle')
                .text(String)
                .transition().delay(750).duration(500)
                .style('opacity', 1);

            rule.exit()
                .style('opacity', 0.000001)
                .remove();

            // Remove any existing lines so they are redrawn over the bars
            rLine = g.selectAll('line').remove();

             // Append lines for scale
            line = g.selectAll('line').data(x.ticks(4))
                    .enter()
                    .append('line')
                    .attr('class', 'line')
                    .style('opacity', 0.000001)
                    .style('stroke', '#ccc')
                    .attr('x1', x)
                    .attr('x2', x)
                    .attr('y1', 0)
                    .attr('y2', function (d, i) {return 25 * data.length - 5; })
                    .transition().delay(750).duration(500)
                    .style('opacity', 1);
        });
    }

    return chart;
};