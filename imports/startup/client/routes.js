import { FlowRouter } from 'meteor/kadira:flow-router'
import { BlazeLayout } from 'meteor/kadira:blaze-layout'

// Import needed templates
import '/imports/ui/pages/home/home'
import '/imports/ui/pages/login/login'
import '/imports/ui/pages/signup/signup'
import '/imports/ui/pages/not-found/not-found'

const userLoginFilter = (context, redirect, stop) => {
	let oldRoute = '/'
	let authRoutes = ['/login', '/signup']

	if (context.oldRoute !== undefined) {
		oldRoute = context.oldRoute.path
	}

	// restrict access to auth pages when user is signed in
	if (Meteor.userId() && authRoutes.includes(context.path)) {
		redirect(oldRoute)
	}
}

FlowRouter.triggers.enter([userLoginFilter], { except: [] })

// Set up all routes in the app
FlowRouter.route('/', {
  	name: 'App.home',
  	action() {
    	BlazeLayout.render('App_body', {
			header: 'header',
			sidebar: 'sidebar',
    		main: 'App_home'
    	})
  	}
})

FlowRouter.route('/login', {
	name: 'login',
	action() {
	  BlazeLayout.render('auth', {
		  main: 'login'
	  })
	}
})

FlowRouter.route('/signup', {
	name: 'signup',
	action() {
	  BlazeLayout.render('auth', {
		  main: 'signup'
	  })
	}
})

FlowRouter.notFound = {
  	action() {
    	BlazeLayout.render('App_body', {
    		main: 'App_notFound'
    	})
  	}
}
