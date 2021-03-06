/**
 * Module for display of locations and activities filters
 *
 * @param {object} p_options
 * @author  Bret Davidson <bret_davidson@ncsu.edu>
 */
var ReportFilters = function (p_options) {

    var options = {
            url: '', // URL for AJAX request (initiative dictionary)
            triggerForm: '', // Form element that triggers AJAX request (CSS ID)
            filterForm: '', // Wrapper element that controls visibility of filters (CSS ID)
            locationsTemplate: '', // CSS ID of locations template
            activitiesTemplate: '', // CSS ID of activities template
            locationsSelect: '', // CSS ID of locations select list
            activitiesSelect: '' // CSS ID of activities select list
        };

    return {
        /**
         * Initializes module
         *
         * @this {ReportFilters}
         */
        init: function () {
            // Check passed options. Copied from http://www.engfers.com/code/javascript-module-pattern/
            if (p_options !== null && p_options !== undefined && p_options !== 'undefined') {
                _.each(options, function (element, index) {
                    if (p_options[index] !== null && p_options[index] !== undefined && p_options[index] !== 'undefined') {
                        options[index] = p_options[index];
                    }
                });
            }

            // Bind event listeners
            this.bindEvents();
        },
        /**
         * Binds event listener for AJAX call for dictionary
         * and filter display
         */
        bindEvents: function () {
            var self = this;

            // Listen for change of initiative
            $(options.triggerForm).on('change', function (e) {
                if (this.value !== 'default') {
                    // Hide filters
                    $(options.filterForm).hide();
                    // Retrieve updated display data
                    $.when(self.getDictionary(this.value))
                        .then(function (data) {
                            // Process data and populate templates
                            self.buildInterfaceElements(data);
                            // Show new filters
                            $(options.filterForm).fadeIn();
                        }, function (e) {
                            $('#welcome').hide();
                            $('#ajax-error').show();
                        });
                } else {
                    // Hide new filters
                    $(options.filterForm).fadeOut();
                }
            });

            $('.suma-popover').popover();
        },
        /**
         * Processes data and populates templates for filters
         *
         * @param {object} data
         * @this {ReportFilters}
         */
        buildInterfaceElements: function (data) {
            // Process locations and activities
            var locations = this.processLocations(data.locations, data.rootLocation),
                activities = this.processActivities(data.activities, data.activityGroups);

            // Set properties to access elsewhere
            this.locations = locations;
            this.activities = activities;

            // Populate templates
            this.buildTemplate(locations, options.locationsTemplate, options.locationsSelect);
            this.buildTemplate(activities, options.activitiesTemplate, options.activitiesSelect);
        },
        /**
         * AJAX call to retrieve dictionary
         *
         * @param  {string} initiative
         * @return {object} Returns a jQuery promise object.
         */
        getDictionary: function (initiative) {
            // AJAX call is returned here to take advantage of jQuery promise object
            return $.ajax({
                data: {
                    id: initiative
                },
                dataType: 'json',
                url: options.url,
                beforeSend: function () {
                    $(options.triggerForm).attr('disabled', 'true');
                    $('#secondary-loading').show();
                },
                complete: function () {
                    $(options.triggerForm).removeAttr('disabled', 'true');
                    $('#secondary-loading').hide();
                }
            });
        },
        /**
         * Sort activities by rank, meant to be used
         * with native arr.sort() method
         *
         * @param  {object} a
         * @param  {object} b
         * @return {integer}
         */
        sortActivities: function (a, b) {
            return a.rank - b.rank;
        },
        /**
         * Sort locations by rank, meant to be used with native
         * arr.sort() method. Used by sortLocations.
         *
         * @param  {object} a
         * @param  {object} b
         * @return {integer}
         */
        propertySort: function (a, b) {
            return a.rank > b.rank ? 1 : (a.rank < b.rank ? -1 : 0);
        },
        /**
         * Sort nested array of locations
         *
         * @param  {arr} arr
         * @this {ReportFilters}
         */
        sortLocations: function (arr) {
            var len = arr.length;

            while (len > 0) {
                len -= 1;
                if (arr[len].children) {
                    this.sortLocations(arr[len].children);
                }
            }

            arr.sort(this.propertySort);
        },
        /**
         * Flatten nested location array
         *
         * @param  {arr} nestedList
         * @param  {arr} flatArray
         * @return {arr}
         */
        buildLocList: function (nestedList, flatArray) {
            var self = this;

            flatArray = flatArray || [];

            _.each(nestedList, function (obj) {
                flatArray.push(obj);
                if (obj.children) {
                    self.buildLocList(obj.children, flatArray);
                }
            });

            return flatArray;
        },
        /**
         * Build location tree
         *
         * @param  {arr} locations
         * @param  {arr} rootLocation
         * @return {arr}
         */
        buildLocTree: function (locations, rootLocation) {
            var memo = {};

            // Build memo object using location ids as keys
            _.each(locations, function (obj, index) {
                memo[obj.id] = obj;
            });

            function locMemo(locations, parentId, depth) {
                var locTree = [];

                // Set default depth
                depth    = depth    || 0;

                // Loop over locations
                _.each(locations, function (obj, index) {

                    // Start at top of tree
                    if (obj.parent === parentId) {
                        delete memo[obj.id];

                        // Build object and recursively build children
                        locTree.push({
                            'id'       : obj.id,
                            'title'    : obj.title,
                            'rank'     : obj.rank,
                            'parent'   : obj.parent,
                            'depth'    : depth,
                            'children' : locMemo(_.clone(memo), obj.id, depth + 1)
                        });
                    }
                });

                return locTree;
            }

            return locMemo(locations, rootLocation);
        },
        /**
         * Build a sorted list of locations
         *
         * @param  {arr} locations
         * @param  {arr} rootLocation
         * @return {arr}
         */
        processLocations: function (locations, rootLocation) {
            var locTree,
                locList;

            // Build location tree from adjacency list
            locTree = this.buildLocTree(locations, rootLocation);

            // Sort locations based on rank at each level of depth
            this.sortLocations(locTree);

            // Flatten tree to sorted array
            locList = this.buildLocList(locTree);
            return locList;
        },
        /**
         * Build a sorted list of activities
         *
         * @param  {arr} activities
         * @param  {arr} activityGroups
         * @return {arr}
         */
        processActivities: function (activities, activityGroups) {
            var activityList = [];

            // Sort activities and activity groups
            activities.sort(this.sortActivities);
            activityGroups.sort(this.sortActivities);

            // For each activity group, build a list of activities
            _.each(activityGroups, function (activityGroup) {
                // Activity group metadata
                var listItem = {
                    'id'   : activityGroup.id,
                    'rank' : activityGroup.rank,
                    'title': activityGroup.title,
                    'type' : 'activityGroup',
                    'depth': 0
                };

                // Add activity group activityList array
                activityList.push(listItem);

                // Loop over activities and add the ones belonging to the current activityGroup
                _.each(activities, function (activity, index) {
                    if (activity.activityGroup === activityGroup.id) {
                        // Activity metadata
                        var listItem = {
                            'id'   : activity.id,
                            'rank' : activity.rank,
                            'title': activity.title,
                            'type' : 'activity',
                            'depth': 1,
                            'activityGroup': activityGroup.id
                        };

                        // Add activities to activityList array behind proper activityGroup
                        activityList.push(listItem);

                    }
                });
            });

            return activityList;
        },
        /**
         * Build and insert template
         *
         * @param  {arr} items
         * @param  {string} templateId
         * @param  {string} elementId
         */
        buildTemplate: function (items, templateId, elementId) {
            var html,
                json,
                template;

            // Insert list into object for template iteration
            json = {items: items};

            // Retrieve template from index.php (in script tag)
            html = $(templateId).html();

            // Compile template
            template = Handlebars.compile(html);

            // Template helper to convert depth to emdash
            Handlebars.registerHelper('indent', function (depth) {
                var indent = '';
                while (depth > 0) {
                    depth -= 1;
                    indent += '&mdash;';
                }
                return indent;
            });

            // Populate template with data and insert into DOM
            $(elementId).empty();
            $(elementId).append(template(json));
        }
    };
};