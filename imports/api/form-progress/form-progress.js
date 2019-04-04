import { Mongo } from "meteor/mongo";
import { isModerator } from "/imports/api/user/methods";
import { ProjectQuestions } from "/imports/api/project-questions/project-questions";
import { UserQuestions } from "/imports/api/userQuestions/userQuestions";

export const FormProgress = new Mongo.Collection("formProgress");

if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish("formProgress", function(formTypeID) {
    if (!Meteor.userId()) return;

    const userEmail = ((Meteor.user().emails || [])[0] || {}).address;

    if (formTypeID) {
      if (
        !ProjectQuestions.findOne({
          _id: formTypeID,
          $or: [
            {
              createdBy: Meteor.userId()
            },
            {
              "team_members.email": userEmail
            }
          ]
        }) &&
        !UserQuestions.find({
          _id: formTypeID,
          createdBy: Meteor.userId()
        })
      ) {
        throw new Meteor.Error(
          "Error",
          "Resource not found or insufficient permissions."
        );
      } else {
        return FormProgress.find({ form_type_id: formTypeID });
      }
    } else {
      let questions = ProjectQuestions.find({
        $or: [
          {
            createdBy: Meteor.userId()
          },
          {
            "team_members.email": userEmail
          }
        ]
      }).fetch();

      let info = UserQuestions.find({
        createdBy: Meteor.userId()
      }).fetch();

      return FormProgress.find({
        form_type_id: {
          $in: _.union(questions.map(i => i._id), info.map(i => i._id))
        }
      });
    }
  });

  Meteor.publish("modFormProgress", projectID => {
    if (Meteor.userId() && isModerator(Meteor.userId())) {
      if (projectID) {
        return FormProgress.find({
          form_type_id: projectID
        });
      } else {
        return FormProgress.find({});
      }
    }
  });
}
