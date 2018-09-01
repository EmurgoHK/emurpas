import './viewApplication.html'

import { ProjectQuestions } from '/imports/api/project-questions/project-questions';
import { FormProgress } from '/imports/api/form-progress/form-progress'

Template.viewApplication.onCreated(function() {
    this.autorun(() => {
        this.subscribe('projectQuestions', FlowRouter.getParam("projectID")),
        this.subscribe('formProgress', FlowRouter.getParam("projectID"))
    })
})

Template.viewApplication.helpers({
    projectID () {
        return FlowRouter.getParam("projectID")
    },
    project () {
        var project = ProjectQuestions.findOne({ "_id" : FlowRouter.getParam("projectID") })
        var schema = ProjectQuestions.schema._schema
        var result = {}

        for (let i = 0; i < ProjectQuestions.schema._firstLevelSchemaKeys.length; i++) {
            var key = ProjectQuestions.schema._firstLevelSchemaKeys[i]
            if (project.hasOwnProperty(key)) { 
                result[schema[key].label] = project[key]
            }
        }

        return result
    }
})