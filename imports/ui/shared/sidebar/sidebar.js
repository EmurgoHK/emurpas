import './sidebar.html'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { ProjectQuestions } from '/imports/api/project-questions/project-questions';
import { FormProgress } from '/imports/api/form-progress/form-progress'
import { markProjectInvalid } from '/imports/api/project-questions/methods'

import swal from 'sweetalert2'

Template.sidebar.onCreated(function() {
    this.autorun(() => {
      this.subscribe('projectQuestions')
    })
})

Template.sidebar.events({
    'click .sidebar-minimizer': function() {
        $('body').toggleClass("sidebar-minimized")
    },

    'click .new-application': function() {
        let projects = []

        let user = Meteor.users.findOne({
    		_id: Meteor.userId()
        })
        
        if (user) {
            projects =  ProjectQuestions.find({
            $or: [{
                createdBy: Meteor.userId(),
            }, {
                'team_members.email': ((user.emails || [])[0] || {}).address 
            }],
            $or: [{
                isInvalid: null
            }, {
                isInvalid : false
            }]
            }, {
                sort: {
                    createdAt: -1
                }
            }).fetch().map(i => _.extend(i, {
                progress: FormProgress.findOne({
                    form_type_id: i._id
                })
            }))
        }

        let checkboxInput = ''
        projects.map(p => {
            checkboxInput+= `<div class="radio"><label><input class="radio-button-modal" type="radio" name="optionsRadios" id="${p._id}" value="${p._id}">${p.problem_description}</label></div>`
        })

        swal({
            title: 'Are you trying to add a new application ?',
            text: "Are you trying to add a new application or updating previously added application?",
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            cancelButtonText: 'No',
            confirmButtonText: 'Yes'
          }).then(function(result) {
            if (result.value) { // if the user clicks on new application
                FlowRouter.go('/applications')
            } else if (checkboxInput != '') { // if user clicks cancel but there are no projects
                Swal({
                    type: 'warning',
                    title: 'You do not have any applications',
                    text: 'You will now be redirected to applidations page where you can add a new project application',
                    footer: '<a href>Why do I have this issue?</a>'
                  }).then(result => {
                    FlowRouter.go('/applications')
                  })
            } else if (result.dismiss === 'cancel') { // if user cancels
                swal({
                        type: 'warning',
                        title: 'Please select an application which is no longer valid',
                        text: 'You must select an application which is no longer a valid application.',
                        html: checkboxInput,
                        preConfirm: () => {
                            let radio = $('.radio-button-modal:checked')
                            return radio.length > 0 ? radio[0].value : '';
                        }
                    }).then((result => {
                        if (result.value !== true && result.value != '') {
                            // update the application here
                            markProjectInvalid.call({ projectId: result.value}, (err, resp) => { // mark the application as invalid 
                                if (!err) {
                                    FlowRouter.go('/applications')
                                } else {
                                    swal({
                                        type: 'error',
                                        title: 'Oops...',
                                        text: 'Something went wrong!',
                                        footer: '<a href>Why do I have this issue?</a>'
                                      })
                                }
                            });
                        }
                    }));
            } else {
              console.log(`modal was dismissed by ${result.dismiss}`)
            }

            
          })
    }

})