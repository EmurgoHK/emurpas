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
      .fetch();

    let uq = UserQuestions.find({
      createdBy: Meteor.userId()
    })
      .fetch();

    let fPq = FormProgress.findOne({
      form_type_id: {
        $in: pq.map(i => i._id),
      },
      status: "completed"
    });

    let fUq = FormProgress.findOne({
      form_type_id: {
        $in: uq.map(i => i._id)
      },
      status: "completed"
    });

    if (pq && fPq && !fUq && !swal.getState().isOpen) {
      // force users to the userinfo page if they haven't completed it yet
      swal({
        title: "You have to fill out this form first!",
        text: `You have been marked as a team member or you have submitted a project application, so you should go complete the application by answering a few questions about yourself!
          The application says you are trying to solve:
          ${pq[0].problem_description}`,
        closeOnClickOutside: false,
        closeOnEsc: false,
        buttons: [{
          text: "OK",
          value: true,
          visible: true,
          className: "btn btn-primary",
          closeModal: true,
        },{
          text: "View application",
          value: false,
          visible: true,
          className: "btn btn-secondary",
          closeModal: true,
        }],
        showCloseButton: false,
        showCancelButton: true,
        icon: "warning",
      }).then(
        (v) => v ? FlowRouter.go('/userInfo') : FlowRouter.go(`/applications/${pq[0]._id}/view`), 
        () => FlowRouter.go('/userInfo'),
      );
    }
  });
};
