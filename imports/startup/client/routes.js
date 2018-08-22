import { FlowRouter } from 'meteor/kadira:flow-router'
import { BlazeLayout } from 'meteor/kadira:blaze-layout'
import { notify } from "/imports/modules/notifier"

// Import needed templates
import '/imports/ui/pages/home/home'
import '/imports/ui/pages/userInfo/userInfo'
import '/imports/ui/pages/applications/new'
import '/imports/ui/pages/login/login'
import '/imports/ui/pages/signup/signup'
import '/imports/ui/pages/example/example'
import '/imports/ui/pages/not-found/not-found'

const userLoginFilter = (context, redirect, _stop) => {
	let oldRoute = '/'
	let authRoutes = ['/login', '/signup']

	if (context.oldRoute !== undefined) {
		oldRoute = context.oldRoute.path
	}

	// restrict access to auth pages when user is signed in
	if (Meteor.userId() && authRoutes.includes(context.path)) {
		redirect(oldRoute)
	}

	if (!Meteor.userId() && !authRoutes.includes(context.path)) {
		notify("Login to continue!", "error")
		redirect('/login')
	}
}

// Redirect to login
Accounts.onLogout((user) => {
	FlowRouter.go('/login')
})

FlowRouter.triggers.enter([userLoginFilter], { except: ['App.home'] })

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

FlowRouter.route('/userInfo', {
  	name: 'userInfo',
  	action: () => {
    	BlazeLayout.render('App_body', {
			header: 'header',
			sidebar: 'sidebar',
    		main: 'userInfo'
    	})
  	}
})

FlowRouter.route('/applications/:projectID?', {
	name: 'newApplication',
	action: () => {
	  BlazeLayout.render('App_body', {
		  header: 'header',
		  sidebar: 'sidebar',
		  main: 'newApplication'
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

FlowRouter.route('/example', {
	name: 'example',
	action() {
	  BlazeLayout.render('App_body', {
		  header: 'header',
		  sidebar: 'sidebar',
		  main: 'example'
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
