(function($) {
    // TODO: make the node ID configurable
    var treeNode = $('#jsdoc-toc-nav');

    // initialize the tree
    treeNode.tree({
        autoEscape: false,
        closedIcon: '&#x21e2;',
        data: [{"label":"<a href=\"DV3D.html\">DV3D</a>","id":"DV3D","children":[{"label":"<a href=\"DV3D.Collection.html\">Collection</a>","id":"DV3D.Collection","children":[]},{"label":"<a href=\"DV3D.Entry.html\">Entry</a>","id":"DV3D.Entry","children":[]},{"label":"<a href=\"DV3D.GizmoMove.html\">GizmoMove</a>","id":"DV3D.GizmoMove","children":[]},{"label":"<a href=\"DV3D.GizmoRotate.html\">GizmoRotate</a>","id":"DV3D.GizmoRotate","children":[]},{"label":"<a href=\"DV3D.ImageEntry.html\">ImageEntry</a>","id":"DV3D.ImageEntry","children":[]},{"label":"<a href=\"DV3D.ImagePane.html\">ImagePane</a>","id":"DV3D.ImagePane","children":[]},{"label":"<a href=\"DV3D.Measure.html\">Measure</a>","id":"DV3D.Measure","children":[]},{"label":"<a href=\"DV3D.Pin.html\">Pin</a>","id":"DV3D.Pin","children":[]},{"label":"<a href=\"DV3D.Plan.html\">Plan</a>","id":"DV3D.Plan","children":[]},{"label":"<a href=\"DV3D.PlanEntry.html\">PlanEntry</a>","id":"DV3D.PlanEntry","children":[]}]}],
        openedIcon: ' &#x21e3;',
        saveState: true,
        useContextMenu: false
    });

    // add event handlers
    // TODO
})(jQuery);
