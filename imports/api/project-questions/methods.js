import { ValidatedMethod } from 'meteor/mdg:validated-method'
import SimpleSchema from 'simpl-schema'

import { ProjectQuestions } from './project-questions'

SimpleSchema.extendOptions(['autoform'])

export const addProjectQuestions = new ValidatedMethod({
    name: 'addProjectQuestions',
    validate: ProjectQuestions.schema.validator({
    	clean: true,
    	filter: false
    }),
    run(newProjectQuestions) {
        ProjectQuestions.insert(newProjectQuestions)
    }
})