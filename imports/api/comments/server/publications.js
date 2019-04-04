import { Meteor } from "meteor/meteor";

import { buildAggregator } from "meteor/lamoglia:publish-aggregation";

import { isModerator } from "../../user/methods";
import { ProjectQuestions } from "../../project-questions/project-questions";
import { Contact } from "../../contact/contact";
import { Comments } from "../comments";

Meteor.publish("comments.item", resId => {
  if (!Meteor.userId()) return;
  const userId = Meteor.userId();
  const isMod = isModerator(Meteor.userId());
  const userEmail = ((Meteor.user().emails || [])[0] || {}).address;
  /*
		Below we check if the user should see the comments of a resource.
		The user can see the comments if:
			- The user is a moderator OR
			- The resource is an application (ProjectQuestions) and the user is either the creator or a team member OR
			- The resource is a question (Contact) and the user is the creator
	 */
  if (
    !isMod &&
    !ProjectQuestions.findOne({
      _id: resId,
      $or: [
        {
          createdBy: userId
        },
        {
          "team_members.email": userEmail
        }
      ]
    }) &&
    !UserQuestions.find({
      _id: resId,
      createdBy: userId
    })
  ) {
    throw new Meteor.Error(
      "Error",
      "Resource not found or insufficient permissions."
    );
  }

  return Comments.find(
    {
      $and: [
        {
          $or: [
            // It must match the requested item
            { parentId: resId },
            { resourceId: resId }
          ],
          $or: [
            // Filter by isModeratorOnly
            { isModeratorOnly: isMod }, // Moderator only if the user is a moderator
            { isModeratorOnly: false }, // Not moderator only comments can be viewed by anyone
            { isModeratorOnly: { $exists: false } } // If it is not set explicitly we default to public comment
          ]
        }
      ]
    },
    {
      sort: {
        createdAt: -1
      }
    }
  );
});

const countByResourceId = () => [
  {
    $group: {
      _id: { resId: "$resourceId" },
      resourceId: { $last: "$resourceId" },
      count: { $sum: 1 }
    }
  }
];

Meteor.publish(
  "commentCounts.by.resource",
  buildAggregator(Comments, countByResourceId, {
    singleValueField: "count",
    collectionName: "commentCounts"
  })
);
