import { Meteor } from "meteor/meteor";
import { QuestionRating } from "../question-rating";
import { isModerator } from "../../user/methods";
import { ProjectQuestions } from "../../project-questions/project-questions";

Meteor.publish("questionRating.application", appId => {
  const userId = Meteor.userId();
  if (!userId) {
    throw new Meteor.Error("Error", "You have to be logged in.");
  }

  if (
    !isModerator(userId) &&
    !ProjectQuestions.findOne({
      _id: appId,
      $or: [
        {
          createdBy: userId
        },
        {
          "team_members.email": ((Meteor.user().emails || [])[0] || {}).address
        }
      ]
    })
  ) {
    throw new Meteor.Error(
      "Error",
      "Resource not found or insufficient permissions."
    );
  }
  return QuestionRating.find({
    applications: appId
  });
});
