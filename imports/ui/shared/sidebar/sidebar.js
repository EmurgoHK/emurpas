import "./sidebar.html";
import "./sidebar.scss";

import { FlowRouter } from "meteor/kadira:flow-router";
import { ProjectQuestions } from "/imports/api/project-questions/project-questions";
import { FormProgress } from "/imports/api/form-progress/form-progress";
import { markProjectInvalid } from "/imports/api/project-questions/methods";

import swal from "sweetalert2";

Template.sidebar.onCreated(function() {
  this.autorun(() => {
    this.subscribe("projectQuestions");
  });
});

Template.sidebar.events({
  "click .sidebar-minimizer": function() {
    $("body").toggleClass("sidebar-minimized");
  },

  "click .new-application": function() {
    if (Meteor.userId()) {
      const projects = ProjectQuestions.find(
        {
          $and: [
            {
              $or: [
                {
                  createdBy: Meteor.userId()
                },
                {
                  "team_members.email": ((Meteor.user().emails || [])[0] || {})
                    .address
                }
              ]
            },
            {
              $or: [
                {
                  isInvalid: null
                },
                {
                  isInvalid: false
                }
              ]
            }
          ]
        },
        {
          sort: {
            createdAt: -1
          }
        }
      )
        .fetch()
        .map(i =>
          _.extend(i, {
            progress: FormProgress.findOne({
              form_type_id: i._id
            })
          })
        );

      if (!projects || projects.length === 0)
        return FlowRouter.go("/applications");

      swal({
        title: "Are you trying to add a new application ?",
        text:
          "Are you trying to add a new application or updating previously added application?",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        cancelButtonText: "No",
        confirmButtonText: "Yes"
      }).then(function(result) {
        if (result.value) {
          // if the user clicks on new application
          FlowRouter.go("/applications");
        } else if (result.dismiss === "cancel") {
          // if user cancels
          const checkboxInput = `
            <ul>
              ${projects.map(
                p =>
                  `<li class="modal-radio-list">
                    <input class="radio-button-modal" type="radio" 
                          name="optionsRadios" id="${p._id}" value="${p._id}">
                    <label for="${p._id}">
                      ${p.problem_description}
                    </label>
                </li>`
              )}
            </ul>`;
          swal({
            type: "warning",
            title: "Please select an application to invalidate",
            html: checkboxInput,
            preConfirm: () => {
              let radio = $(".radio-button-modal:checked");
              return radio.length > 0 ? radio[0].value : "";
            }
          }).then(result => {
            if (result.value && result.value.length > 0) {
              // update the application here
              markProjectInvalid.call(
                { projectId: result.value },
                (err, resp) => {
                  // mark the application as invalid
                  if (!err) {
                    FlowRouter.go(`/applications`);
                  } else {
                    swal({
                      type: "error",
                      title: "Oops...",
                      text: "Something went wrong!"
                    });
                  }
                }
              );
            }
          });
        } else {
          console.log(`modal was dismissed by ${result.dismiss}`);
        }
      });
    } else {
      FlowRouter.go("/login");
    }
  }
});
