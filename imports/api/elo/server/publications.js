import { Meteor } from "meteor/meteor";

import { isModerator } from "../../user/methods";
import { EloRankings } from "../eloRankings";

Meteor.publish("elo", apps => {
  // publish all elo rankings tfor given apps
  if (isModerator(Meteor.userId())) {
    throw new Meteor.Error("Error", "Insufficient permissions.");
  }

  return EloRankings.find(
    {
      applicationId: {
        $in: apps
      }
    },
    {
      sort: {
        createdAt: -1
      }
    }
  );
});
