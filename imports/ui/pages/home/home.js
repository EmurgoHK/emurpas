import './home.html'

import { ProjectQuestions } from '/imports/api/project-questions/project-questions';
import { FormProgress } from '/imports/api/form-progress/form-progress'

Template.App_home.onCreated(function() {
    this.autorun(() => {
        this.subscribe('projectQuestions'),
        this.subscribe('formProgress')
    })
})

Template.App_home.helpers({
    projectquestions: () => ProjectQuestions.find({
        createdBy: Meteor.userId()
    }, {
        sort: {
            createdAt: -1
        }
    }),
    inprogress: (projectId) => {
    	//Check to see if an application has an in-progress form in progress, if it does return a resume button.
        let inprogress = FormProgress.findOne({ form_type_id: projectId });
        if (inprogress && inprogress.status == 'in-progress') {
            return true;
        }
    },

})