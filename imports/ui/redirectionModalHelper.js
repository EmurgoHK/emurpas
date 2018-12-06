import swal from "sweetalert";

import { ProjectQuestions } from '/imports/api/project-questions/project-questions';
import { FormProgress } from '/imports/api/form-progress/form-progress'
import { UserQuestions } from '/imports/api/userQuestions/userQuestions'

/**
 * Redirect to /userInfo after showing a modal if the user has submitted a project but didn't complete /userQuestions
 * @param {TemplateInstance} tpl 
 */
export function redirectToUserInfoIfNeeded(tpl) {
  tpl.subscribe("projectQuestions");
  tpl.subscribe("formProgress");
  tpl.subscribe("users");
  tpl.subscribe("userInfo");

  tpl.autorun(() => {
    if (!tpl.subscriptionsReady() || !Meteor.userId())
      return;

    let pq = ProjectQuestions.find({
      $or: [
        {
          createdBy: Meteor.userId()
        },
        {
          "team_members.email": ((Meteor.user().emails || [])[0] || {}).address
        }
      ]
    })
      .fetch()
      .map(i => i._id);

    let uq = UserQuestions.find({
      createdBy: Meteor.userId()
    })
      .fetch()
      .map(i => i._id);

    let fPq = FormProgress.findOne({
      form_type_id: {
        $in: pq
      },
      status: "completed"
    });

    let fUq = FormProgress.findOne({
      form_type_id: {
        $in: uq
      },
      status: "completed"
    });

    if (fPq && !fUq && !swal.getState().isOpen) {
      // force users to the userinfo page if they haven't completed it yet
      swal({
        title: "You have to fill out this form first!",
        text: "You have been marked as a team member or you have submitted a project application, so you should go complete the application by answering a few questions about yourself!",
        closeOnClickOutside: false,
        closeOnEsc: false,
        icon: "warning",
      }).then(() => FlowRouter.go('/userInfo'), () => FlowRouter.go('/userInfo'));
    }
  });
};
