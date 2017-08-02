angular.module('docApp').constant('DOCS_NAVIGATION', {
  "api": {
    "id": "api",
    "href": "api/index",
    "name": "API",
    "navGroups": [
      {
        "name": "dokuvisApp",
        "type": "groups",
        "href": "api/dokuvisApp",
        "navItems": [
          {
            "name": "controller",
            "type": "section",
            "href": "api/dokuvisApp/controller",
            "navItems": [
              {
                "name": "categoryEditModalCtrl",
                "type": "controller",
                "href": "api/dokuvisApp/controller/categoryEditModalCtrl"
              },
              {
                "name": "configCtrl",
                "type": "controller",
                "href": "api/dokuvisApp/controller/configCtrl"
              },
              {
                "name": "explorerCtrl",
                "type": "controller",
                "href": "api/dokuvisApp/controller/explorerCtrl"
              },
              {
                "name": "navCtrl",
                "type": "controller",
                "href": "api/dokuvisApp/controller/navCtrl"
              },
              {
                "name": "newArchiveModalCtrl",
                "type": "controller",
                "href": "api/dokuvisApp/controller/newArchiveModalCtrl"
              },
              {
                "name": "newProjInfoModalCtrl",
                "type": "controller",
                "href": "api/dokuvisApp/controller/newProjInfoModalCtrl"
              },
              {
                "name": "newSubprojectModalCtrl",
                "type": "controller",
                "href": "api/dokuvisApp/controller/newSubprojectModalCtrl"
              },
              {
                "name": "projHomeCtrl",
                "type": "controller",
                "href": "api/dokuvisApp/controller/projHomeCtrl"
              },
              {
                "name": "projectModalCtrl",
                "type": "controller",
                "href": "api/dokuvisApp/controller/projectModalCtrl"
              },
              {
                "name": "projectlistCtrl",
                "type": "controller",
                "href": "api/dokuvisApp/controller/projectlistCtrl"
              },
              {
                "name": "registerCtrl",
                "type": "controller",
                "href": "api/dokuvisApp/controller/registerCtrl"
              },
              {
                "name": "sourceDetailCtrl",
                "type": "controller",
                "href": "api/dokuvisApp/controller/sourceDetailCtrl"
              },
              {
                "name": "taskModalCtrl",
                "type": "controller",
                "href": "api/dokuvisApp/controller/taskModalCtrl"
              },
              {
                "name": "tasksCtrl",
                "type": "controller",
                "href": "api/dokuvisApp/controller/tasksCtrl"
              },
              {
                "name": "uploadCtrl",
                "type": "controller",
                "href": "api/dokuvisApp/controller/uploadCtrl"
              }
            ]
          },
          {
            "name": "directive",
            "type": "section",
            "href": "api/dokuvisApp/directive",
            "navItems": [
              {
                "name": "commentSection",
                "type": "directive",
                "href": "api/dokuvisApp/directive/commentSection"
              },
              {
                "name": "horizontalScroll",
                "type": "directive",
                "href": "api/dokuvisApp/directive/horizontalScroll"
              },
              {
                "name": "imageViewer",
                "type": "directive",
                "href": "api/dokuvisApp/directive/imageViewer"
              },
              {
                "name": "rampSlider",
                "type": "directive",
                "href": "api/dokuvisApp/directive/rampSlider"
              },
              {
                "name": "webglView",
                "type": "directive",
                "href": "api/dokuvisApp/directive/webglView"
              }
            ]
          },
          {
            "name": "factory",
            "type": "section",
            "href": "api/dokuvisApp/factory",
            "navItems": [
              {
                "name": "Archive",
                "type": "factory",
                "href": "api/dokuvisApp/factory/Archive"
              },
              {
                "name": "AuthenticateResolve",
                "type": "factory",
                "href": "api/dokuvisApp/factory/AuthenticateResolve"
              },
              {
                "name": "AuthenticationFactory",
                "type": "factory",
                "href": "api/dokuvisApp/factory/AuthenticationFactory"
              },
              {
                "name": "Category",
                "type": "factory",
                "href": "api/dokuvisApp/factory/Category"
              },
              {
                "name": "CategoryAttribute",
                "type": "factory",
                "href": "api/dokuvisApp/factory/CategoryAttribute"
              },
              {
                "name": "Comment",
                "type": "factory",
                "href": "api/dokuvisApp/factory/Comment"
              },
              {
                "name": "ConfirmService",
                "type": "factory",
                "href": "api/dokuvisApp/factory/ConfirmService"
              },
              {
                "name": "ProjInfo",
                "type": "factory",
                "href": "api/dokuvisApp/factory/ProjInfo"
              },
              {
                "name": "Project",
                "type": "factory",
                "href": "api/dokuvisApp/factory/Project"
              },
              {
                "name": "ProjectResolve",
                "type": "factory",
                "href": "api/dokuvisApp/factory/ProjectResolve"
              },
              {
                "name": "SkipResolve",
                "type": "factory",
                "href": "api/dokuvisApp/factory/SkipResolve"
              },
              {
                "name": "Source",
                "type": "factory",
                "href": "api/dokuvisApp/factory/Source"
              },
              {
                "name": "SpatializeInterface",
                "type": "factory",
                "href": "api/dokuvisApp/factory/SpatializeInterface"
              },
              {
                "name": "Subproject",
                "type": "factory",
                "href": "api/dokuvisApp/factory/Subproject"
              },
              {
                "name": "SubprojectResolve",
                "type": "factory",
                "href": "api/dokuvisApp/factory/SubprojectResolve"
              },
              {
                "name": "Task",
                "type": "factory",
                "href": "api/dokuvisApp/factory/Task"
              },
              {
                "name": "TokenInterceptor",
                "type": "factory",
                "href": "api/dokuvisApp/factory/TokenInterceptor"
              },
              {
                "name": "Uploader",
                "type": "factory",
                "href": "api/dokuvisApp/factory/Uploader"
              },
              {
                "name": "UserAuthFactory",
                "type": "factory",
                "href": "api/dokuvisApp/factory/UserAuthFactory"
              },
              {
                "name": "Utilities",
                "type": "factory",
                "href": "api/dokuvisApp/factory/Utilities"
              },
              {
                "name": "ValidateResolve",
                "type": "factory",
                "href": "api/dokuvisApp/factory/ValidateResolve"
              },
              {
                "name": "webglContext",
                "type": "factory",
                "href": "api/dokuvisApp/factory/webglContext"
              }
            ]
          },
          {
            "name": "object",
            "type": "section",
            "href": "api/dokuvisApp/object",
            "navItems": [
              {
                "name": "API",
                "type": "object",
                "href": "api/dokuvisApp/object/API"
              },
              {
                "name": "config",
                "type": "object",
                "href": "api/dokuvisApp/object/config"
              },
              {
                "name": "run",
                "type": "object",
                "href": "api/dokuvisApp/object/run"
              }
            ]
          }
        ]
      }
    ]
  }
});
