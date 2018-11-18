import { FormProgress } from './form-progress'
import { ProjectQuestions } from '/imports/api/project-questions/project-questions'
import SimpleSchema from 'simpl-schema'
import { ValidatedMethod } from 'meteor/mdg:validated-method'

export const updateFormProgress = (formType, formTypeId, formId, steps) => {
    let data = {}
    data.last_step = steps.last
    data.next_step = steps.next
    data.status = steps.final ? 'completed' : 'in-progress'
    data.updated_at = new Date().getTime()

    let formProgress = FormProgress.findOne({ 'form_type_id': formTypeId })

    if (formProgress === undefined) {
        data.user_id = Meteor.userId()
        data.form_type = formType
        data.form_type_id = formTypeId
        data.form_id = formId
        data.created_at = new Date().getTime()

        return FormProgress.insert(data)
    }

    return FormProgress.update({ 'form_type_id': formTypeId }, { $set: data })
}

//calculateFormRating method counts all answers on an application to get an application weight.
export const calculateFormRating = new ValidatedMethod({
    name: 'calculateFormRating',
    validate: new SimpleSchema({
        applicationId: {
            type: String,
            optional: false
        }
    }).validator({
        clean: true
    }),
    run({ applicationId }) {
        if (!Meteor.userId()) {
            throw new Meteor.Error('Error.', 'You have to be logged in.')
        }
        if (Meteor.isServer) {
            //the following method will calculate the length of all fields in projectQuestions to get a rating for each application
            let getProjectData = ProjectQuestions.findOne({ _id: applicationId })

            if (getProjectData) {
                //add to string if set, made sense to check each one to ensure it does not error out if value is missing in DB
                let problem_description = getProjectData.problem_description ? getProjectData.problem_description.count : 0;
                let possible_solution = getProjectData.possible_solution ? getProjectData.possible_solution : 0
                let proposed_solution = getProjectData.proposed_solution ? getProjectData.proposed_solution : 0
                let attempted_solution = getProjectData.attempted_solution ? getProjectData.attempted_solution : 0
                let blockchain_use_reason = getProjectData.blockchain_use_reason ? getProjectData.blockchain_use_reason : 0
                let blockchain_solution_proposal = getProjectData.blockchain_solution_proposal ? getProjectData.blockchain_solution_proposal : 0
                let ada_blockchain_aspects = getProjectData.ada_blockchain_aspects ? getProjectData.ada_blockchain_aspects : 0
                let target_market_size = getProjectData.target_market_size ? getProjectData.target_market_size : 0
                let target_market_regions = getProjectData.target_market_regions ? getProjectData.target_market_regions : 0
                let competitors = getProjectData.competitors ? getProjectData.competitors : 0
                let target_audience = getProjectData.target_audience ? getProjectData.target_audience : 0
                let prototype = getProjectData.prototype ? getProjectData.prototype : 0
                let development_roadmap = getProjectData.development_roadmap ? getProjectData.development_roadmap : 0
                let business_plan = getProjectData.business_plan ? getProjectData.business_plan : 0
                let disruptive_solution_reason = getProjectData.disruptive_solution_reason ? getProjectData.disruptive_solution_reason : 0
                let user_onboarding_process = getProjectData.user_onboarding_process ? getProjectData.user_onboarding_process : 0
                let unfair_advantage_reason = getProjectData.unfair_advantage_reason ? getProjectData.unfair_advantage_reason : 0

                //join all strings togeather ready for count, no need to count each one, we can do it once in the DB call.
                let totalWeight = problem_description + possible_solution + proposed_solution
               + attempted_solution + blockchain_use_reason + blockchain_solution_proposal + ada_blockchain_aspects +
                    target_market_size + target_market_regions + competitors + target_audience + prototype +
                    development_roadmap + business_plan + disruptive_solution_reason + user_onboarding_process + unfair_advantage_reason

                //let get application weight by counting all answers and dividing by total amount of applications
                let applicationWeight = totalWeight.length / ProjectQuestions.find({}).count();  
                 
                //update the applicationWeight against the application record
                ProjectQuestions.update({ '_id': applicationId }, { $set: { applicationWeight: applicationWeight } })

            }

        }
    }
})