angular.module('docApp').constant('DOCS_NAVIGATION', {
  "api": {
    "id": "api",
    "href": "api/index",
    "name": "API",
    "navGroups": [
      {
        "name": "dokuvis.archives",
        "type": "groups",
        "href": "api/dokuvis.archives",
        "navItems": [
          {
            "name": "controller",
            "type": "section",
            "href": "api/dokuvis.archives/controller",
            "navItems": [
              {
                "name": "archiveModalCtrl",
                "type": "controller",
                "href": "api/dokuvis.archives/controller/archiveModalCtrl"
              }
            ]
          },
          {
            "name": "directive",
            "type": "section",
            "href": "api/dokuvis.archives/directive",
            "navItems": [
              {
                "name": "archivesList",
                "type": "directive",
                "href": "api/dokuvis.archives/directive/archivesList"
              }
            ]
          },
          {
            "name": "factory",
            "type": "section",
            "href": "api/dokuvis.archives/factory",
            "navItems": [
              {
                "name": "Archive",
                "type": "factory",
                "href": "api/dokuvis.archives/factory/Archive"
              }
            ]
          }
        ]
      },
      {
        "name": "dokuvis.auth",
        "type": "groups",
        "href": "api/dokuvis.auth",
        "navItems": [
          {
            "name": "factory",
            "type": "section",
            "href": "api/dokuvis.auth/factory",
            "navItems": [
              {
                "name": "AuthenticateResolve",
                "type": "factory",
                "href": "api/dokuvis.auth/factory/AuthenticateResolve"
              },
              {
                "name": "AuthenticationFactory",
                "type": "factory",
                "href": "api/dokuvis.auth/factory/AuthenticationFactory"
              },
              {
                "name": "SkipResolve",
                "type": "factory",
                "href": "api/dokuvis.auth/factory/SkipResolve"
              },
              {
                "name": "TokenInterceptor",
                "type": "factory",
                "href": "api/dokuvis.auth/factory/TokenInterceptor"
              },
              {
                "name": "UserAuthFactory",
                "type": "factory",
                "href": "api/dokuvis.auth/factory/UserAuthFactory"
              },
              {
                "name": "ValidateResolve",
                "type": "factory",
                "href": "api/dokuvis.auth/factory/ValidateResolve"
              }
            ]
          }
        ]
      },
      {
        "name": "dokuvis.authors",
        "type": "groups",
        "href": "api/dokuvis.authors",
        "navItems": [
          {
            "name": "controller",
            "type": "section",
            "href": "api/dokuvis.authors/controller",
            "navItems": [
              {
                "name": "authorModalCtrl",
                "type": "controller",
                "href": "api/dokuvis.authors/controller/authorModalCtrl"
              }
            ]
          },
          {
            "name": "directive",
            "type": "section",
            "href": "api/dokuvis.authors/directive",
            "navItems": [
              {
                "name": "authorList",
                "type": "directive",
                "href": "api/dokuvis.authors/directive/authorList"
              }
            ]
          },
          {
            "name": "factory",
            "type": "section",
            "href": "api/dokuvis.authors/factory",
            "navItems": [
              {
                "name": "Author",
                "type": "factory",
                "href": "api/dokuvis.authors/factory/Author"
              }
            ]
          }
        ]
      },
      {
        "name": "dokuvis.categories",
        "type": "groups",
        "href": "api/dokuvis.categories",
        "navItems": [
          {
            "name": "directive",
            "type": "section",
            "href": "api/dokuvis.categories/directive",
            "navItems": [
              {
                "name": "categoryConfig",
                "type": "directive",
                "href": "api/dokuvis.categories/directive/categoryConfig"
              },
              {
                "name": "categoryList",
                "type": "directive",
                "href": "api/dokuvis.categories/directive/categoryList"
              }
            ]
          },
          {
            "name": "factory",
            "type": "section",
            "href": "api/dokuvis.categories/factory",
            "navItems": [
              {
                "name": "Category",
                "type": "factory",
                "href": "api/dokuvis.categories/factory/Category"
              },
              {
                "name": "CategoryAttribute",
                "type": "factory",
                "href": "api/dokuvis.categories/factory/CategoryAttribute"
              }
            ]
          }
        ]
      },
      {
        "name": "dokuvis.comments",
        "type": "groups",
        "href": "api/dokuvis.comments",
        "navItems": [
          {
            "name": "directive",
            "type": "section",
            "href": "api/dokuvis.comments/directive",
            "navItems": [
              {
                "name": "commentSection",
                "type": "directive",
                "href": "api/dokuvis.comments/directive/commentSection"
              }
            ]
          },
          {
            "name": "factory",
            "type": "section",
            "href": "api/dokuvis.comments/factory",
            "navItems": [
              {
                "name": "Comment",
                "type": "factory",
                "href": "api/dokuvis.comments/factory/Comment"
              }
            ]
          }
        ]
      },
      {
        "name": "dokuvis.models",
        "type": "groups",
        "href": "api/dokuvis.models",
        "navItems": [
          {
            "name": "controller",
            "type": "section",
            "href": "api/dokuvis.models/controller",
            "navItems": [
              {
                "name": "modelUploadModalCtrl",
                "type": "controller",
                "href": "api/dokuvis.models/controller/modelUploadModalCtrl"
              }
            ]
          },
          {
            "name": "directive",
            "type": "section",
            "href": "api/dokuvis.models/directive",
            "navItems": [
              {
                "name": "versionDetail",
                "type": "directive",
                "href": "api/dokuvis.models/directive/versionDetail"
              },
              {
                "name": "versionGraph",
                "type": "directive",
                "href": "api/dokuvis.models/directive/versionGraph"
              }
            ]
          },
          {
            "name": "factory",
            "type": "section",
            "href": "api/dokuvis.models/factory",
            "navItems": [
              {
                "name": "DigitalObject",
                "type": "factory",
                "href": "api/dokuvis.models/factory/DigitalObject"
              },
              {
                "name": "ModelUploader",
                "type": "factory",
                "href": "api/dokuvis.models/factory/ModelUploader"
              },
              {
                "name": "ModelVersion",
                "type": "factory",
                "href": "api/dokuvis.models/factory/ModelVersion"
              },
              {
                "name": "Software",
                "type": "factory",
                "href": "api/dokuvis.models/factory/Software"
              }
            ]
          }
        ]
      },
      {
        "name": "dokuvis.projects",
        "type": "groups",
        "href": "api/dokuvis.projects",
        "navItems": [
          {
            "name": "controller",
            "type": "section",
            "href": "api/dokuvis.projects/controller",
            "navItems": [
              {
                "name": "projectModalCtrl",
                "type": "controller",
                "href": "api/dokuvis.projects/controller/projectModalCtrl"
              }
            ]
          },
          {
            "name": "directive",
            "type": "section",
            "href": "api/dokuvis.projects/directive",
            "navItems": [
              {
                "name": "projectList",
                "type": "directive",
                "href": "api/dokuvis.projects/directive/projectList"
              }
            ]
          },
          {
            "name": "factory",
            "type": "section",
            "href": "api/dokuvis.projects/factory",
            "navItems": [
              {
                "name": "Project",
                "type": "factory",
                "href": "api/dokuvis.projects/factory/Project"
              },
              {
                "name": "ProjectResolve",
                "type": "factory",
                "href": "api/dokuvis.projects/factory/ProjectResolve"
              }
            ]
          }
        ]
      },
      {
        "name": "dokuvis.projinfos",
        "type": "groups",
        "href": "api/dokuvis.projinfos",
        "navItems": [
          {
            "name": "controller",
            "type": "section",
            "href": "api/dokuvis.projinfos/controller",
            "navItems": [
              {
                "name": "projinfoModalCtrl",
                "type": "controller",
                "href": "api/dokuvis.projinfos/controller/projinfoModalCtrl"
              }
            ]
          },
          {
            "name": "directive",
            "type": "section",
            "href": "api/dokuvis.projinfos/directive",
            "navItems": [
              {
                "name": "projinfoList",
                "type": "directive",
                "href": "api/dokuvis.projinfos/directive/projinfoList"
              }
            ]
          },
          {
            "name": "factory",
            "type": "section",
            "href": "api/dokuvis.projinfos/factory",
            "navItems": [
              {
                "name": "ProjInfo",
                "type": "factory",
                "href": "api/dokuvis.projinfos/factory/ProjInfo"
              }
            ]
          }
        ]
      },
      {
        "name": "dokuvis.sources",
        "type": "groups",
        "href": "api/dokuvis.sources",
        "navItems": [
          {
            "name": "controller",
            "type": "section",
            "href": "api/dokuvis.sources/controller",
            "navItems": [
              {
                "name": "sourceDetailModalCtrl",
                "type": "controller",
                "href": "api/dokuvis.sources/controller/sourceDetailModalCtrl"
              },
              {
                "name": "sourceUploadModalCtrl",
                "type": "controller",
                "href": "api/dokuvis.sources/controller/sourceUploadModalCtrl"
              }
            ]
          },
          {
            "name": "directive",
            "type": "section",
            "href": "api/dokuvis.sources/directive",
            "navItems": [
              {
                "name": "sourcesList",
                "type": "directive",
                "href": "api/dokuvis.sources/directive/sourcesList"
              }
            ]
          },
          {
            "name": "factory",
            "type": "section",
            "href": "api/dokuvis.sources/factory",
            "navItems": [
              {
                "name": "Source",
                "type": "factory",
                "href": "api/dokuvis.sources/factory/Source"
              },
              {
                "name": "SourceUploader",
                "type": "factory",
                "href": "api/dokuvis.sources/factory/SourceUploader"
              },
              {
                "name": "SourcesCache",
                "type": "factory",
                "href": "api/dokuvis.sources/factory/SourcesCache"
              }
            ]
          }
        ]
      },
      {
        "name": "dokuvis.staff",
        "type": "groups",
        "href": "api/dokuvis.staff",
        "navItems": [
          {
            "name": "controller",
            "type": "section",
            "href": "api/dokuvis.staff/controller",
            "navItems": [
              {
                "name": "staffModalCtrl",
                "type": "controller",
                "href": "api/dokuvis.staff/controller/staffModalCtrl"
              }
            ]
          },
          {
            "name": "directive",
            "type": "section",
            "href": "api/dokuvis.staff/directive",
            "navItems": [
              {
                "name": "staffList",
                "type": "directive",
                "href": "api/dokuvis.staff/directive/staffList"
              }
            ]
          },
          {
            "name": "factory",
            "type": "section",
            "href": "api/dokuvis.staff/factory",
            "navItems": [
              {
                "name": "Staff",
                "type": "factory",
                "href": "api/dokuvis.staff/factory/Staff"
              }
            ]
          }
        ]
      },
      {
        "name": "dokuvis.subprojects",
        "type": "groups",
        "href": "api/dokuvis.subprojects",
        "navItems": [
          {
            "name": "controller",
            "type": "section",
            "href": "api/dokuvis.subprojects/controller",
            "navItems": [
              {
                "name": "subprojectModalCtrl",
                "type": "controller",
                "href": "api/dokuvis.subprojects/controller/subprojectModalCtrl"
              }
            ]
          },
          {
            "name": "directive",
            "type": "section",
            "href": "api/dokuvis.subprojects/directive",
            "navItems": [
              {
                "name": "subprojectList",
                "type": "directive",
                "href": "api/dokuvis.subprojects/directive/subprojectList"
              }
            ]
          },
          {
            "name": "factory",
            "type": "section",
            "href": "api/dokuvis.subprojects/factory",
            "navItems": [
              {
                "name": "Subproject",
                "type": "factory",
                "href": "api/dokuvis.subprojects/factory/Subproject"
              },
              {
                "name": "SubprojectResolve",
                "type": "factory",
                "href": "api/dokuvis.subprojects/factory/SubprojectResolve"
              }
            ]
          }
        ]
      },
      {
        "name": "dokuvis.tasks",
        "type": "groups",
        "href": "api/dokuvis.tasks",
        "navItems": [
          {
            "name": "controller",
            "type": "section",
            "href": "api/dokuvis.tasks/controller",
            "navItems": [
              {
                "name": "taskModalCtrl",
                "type": "controller",
                "href": "api/dokuvis.tasks/controller/taskModalCtrl"
              }
            ]
          },
          {
            "name": "directive",
            "type": "section",
            "href": "api/dokuvis.tasks/directive",
            "navItems": [
              {
                "name": "taskDetail",
                "type": "directive",
                "href": "api/dokuvis.tasks/directive/taskDetail"
              },
              {
                "name": "tasksGantt",
                "type": "directive",
                "href": "api/dokuvis.tasks/directive/tasksGantt"
              }
            ]
          },
          {
            "name": "factory",
            "type": "section",
            "href": "api/dokuvis.tasks/factory",
            "navItems": [
              {
                "name": "Task",
                "type": "factory",
                "href": "api/dokuvis.tasks/factory/Task"
              }
            ]
          }
        ]
      },
      {
        "name": "dokuvis.utils",
        "type": "groups",
        "href": "api/dokuvis.utils",
        "navItems": [
          {
            "name": "directive",
            "type": "section",
            "href": "api/dokuvis.utils/directive",
            "navItems": [
              {
                "name": "fileDropArea",
                "type": "directive",
                "href": "api/dokuvis.utils/directive/fileDropArea"
              }
            ]
          },
          {
            "name": "factory",
            "type": "section",
            "href": "api/dokuvis.utils/factory",
            "navItems": [
              {
                "name": "ConfirmDialog",
                "type": "factory",
                "href": "api/dokuvis.utils/factory/ConfirmDialog"
              },
              {
                "name": "Utilities",
                "type": "factory",
                "href": "api/dokuvis.utils/factory/Utilities"
              }
            ]
          }
        ]
      },
      {
        "name": "dokuvis.viewport",
        "type": "groups",
        "href": "api/dokuvis.viewport",
        "navItems": [
          {
            "name": "directive",
            "type": "section",
            "href": "api/dokuvis.viewport/directive",
            "navItems": [
              {
                "name": "viewport",
                "type": "directive",
                "href": "api/dokuvis.viewport/directive/viewport"
              },
              {
                "name": "viewportNavigation",
                "type": "directive",
                "href": "api/dokuvis.viewport/directive/viewportNavigation"
              }
            ]
          }
        ]
      },
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
                "name": "projHomeCtrl",
                "type": "controller",
                "href": "api/dokuvisApp/controller/projHomeCtrl"
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
                "name": "AuthenticationFactory",
                "type": "factory",
                "href": "api/dokuvisApp/factory/AuthenticationFactory"
              },
              {
                "name": "ConfirmService",
                "type": "factory",
                "href": "api/dokuvisApp/factory/ConfirmService"
              },
              {
                "name": "SpatializeInterface",
                "type": "factory",
                "href": "api/dokuvisApp/factory/SpatializeInterface"
              },
              {
                "name": "TokenInterceptor",
                "type": "factory",
                "href": "api/dokuvisApp/factory/TokenInterceptor"
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
  },
  "guide": {
    "id": "guide",
    "href": "guide/index",
    "name": "Guide",
    "navGroups": [
      {
        "name": "Guide",
        "type": "groups",
        "href": "guide",
        "navItems": [
          {
            "name": "ApiParams",
            "type": "",
            "href": "guide/ApiParams",
            "title": "ApiParams"
          },
          {
            "name": "StateModalConfiguration",
            "type": "",
            "href": "guide/StateModalConfiguration",
            "title": "$state configuration for modals"
          },
          {
            "name": "index",
            "type": "",
            "href": "guide/index",
            "title": "Component guide"
          }
        ]
      }
    ]
  }
});
