import { FormProgress } from './form-progress'

export const updateFormProgress = (formType, formTypeId, steps) => {
    let data = {}
    data.last_step = steps.last
    data.next_step = steps.next
    data.status  = steps.final ? 'completed' : 'in-progress'
    data.updated_at = new Date().getTime()

    let formProgress = FormProgress.findOne({ 'form_type_id' : formTypeId })

    if (formProgress === undefined) {
        data.user_id = Meteor.userId()
        data.form_type = formType
        data.form_type_id = formTypeId
        data.created_at = new Date().getTime()

        return FormProgress.insert(data)
    }
    
    return FormProgress.update({ 'form_type_id' : formTypeId }, { $set : data })
}