import React from 'react'
import PropTypes from 'prop-types'
import Button from 'components/Button/Button'
import {
	form
} from './ContactForm.module.scss'

const ContactForm = ( { files } ) => {

	const buttonID = `${form}-submit`

	//Dev testing
	files = true

	//https://wp-source.bigupweb.uk/wp-json/bigup/contact-form/v1/submit

	//Rest api handles nonces automatically - Disable this???

	//Backend expects payload type of 'multipart/form-data'

	/*
	Payload should contain the following:
		$data[ 'fields' ] = [
			'email'   => $text_data[ 'email' ],
			'name'    => $text_data[ 'name' ],
			'message' => $text_data[ 'message' ]
		];
	*/


	// See here for JWT Auth
	// https://hashinteractive.com/blog/headless-wordpress-jwt-vue-authentication/




	/**
     * For debugging, set 'debug = true'. Output will be
     * sent to the console.
     */
	let debug = true


	/**
     * Holds the start time of the request for debugging.
     */
	let start


	/**
     * Log timestamps in debug mode.
     * @returns milliseconds since function call.
     */
	function stopwatch() {
		let elapsed = Date.now() - start
		return elapsed.toString().padStart( 5, '0' )
	}


	/**
     * Allowed MIME type array.
	 * 
	 * Eventually this should be populated from form plugin settings.
     */
	const allowedMimeTypes = [
		'image/jpeg',
		'image/png',
		'image/gif',
		'image/webp',
		'image/svg+xml',
		'application/pdf',
		'application/vnd.oasis.opendocument.text',
		'application/vnd.oasis.opendocument.spreadsheet',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'application/msword',
	]


	/**
     * Grab WP localize vars.
     * 
     * wp_localize_bigup_contact_form_vars.*
     * .rest_url;
     * .rest_nonce;
     * .admin_email;
     * 
     */
	//const wp = wp_localize_bigup_contact_form_vars
	const wp = {
		'rest_url': 'https://wp-source.bigupweb.uk/wp-json/bigup/contact-form/v1/submit',
		'rest_nonce': 'bad_nonce_to_test',
		'admin_email': 'me@jeffersonreal.uk'
	}



	let form_init = setInterval( () => {
		if ( document.readyState === 'complete' ) {
			clearInterval( form_init )
			document.querySelector( '.' + form ).addEventListener( 'submit', handle_form_submit )
		}
	}, 250 )





	/**
     * True when the form is processing a submission.
     */
	let form_busy = false


	/**
     * Handle the submitted form.
     * 
     * Calls all functions to perform the form submission, and handle
     * user feedback displayed over the form as 'popout messages'.
     * Popout transitions and fetch request are performed asynchronously.
     * 
     * @param {SubmitEvent} event
     * 
     */
	async function handle_form_submit( event ) {

		event.preventDefault()
		start = Date.now()
		if( debug ) console.log( 'Time | Start/Finish | Function | Target' )
		if( debug ) console.log( stopwatch() + ' |START| handle_form_submit' )

		const form = event.currentTarget
		const output = form.querySelector( '.form_output' )
		let classes = [ 'form-popout', 'alert' ]

		// boot bots if honeypot is filled.
		if ( '' != form.querySelector( '[name="required_field"]' ).value ) {
			document.documentElement.remove()
			window.location.replace( 'https://en.wikipedia.org/wiki/Robot' )
		}

		const formData    = new FormData()
		const textInputs  = form.querySelectorAll( '.form_input' )
		const fileInput   = form.querySelector( '.customFileUpload_input' )

		textInputs.forEach( input => {
			formData.append( input.name, input.value )
		} )

		if ( fileInput ) {
			const files = fileInput.files

			// Loop through each of the selected files.
			for( let i = 0; i < files.length; i++ ){
				let file = files[ i ]
				// Check the file type
				if ( allowedMimeTypes.includes( file.type ) ) {

					// Add the file to the form's data.
					formData.append( 'files[]', file, file.name )

				} else {

					// Animate an error message for bad MIME type.
					classes = [ ...classes, 'alert-danger' ]
					output.style.display = 'flex'
					await transition( output, 'opacity', '0' )
					await remove_children( output )
					await popouts_into_dom( output, [ 'The selected file type is not allowed' ], classes )
					await transition( output, 'opacity', '1' )
					await pause( 5000 )
					await transition( output, 'opacity', '0' )
					await remove_children( output )
					output.style.display = 'none'
					return
				}
			}
		}

		// Fetch params.
		const url = wp.rest_url
		const fetch_options = {
			method: 'POST',
			headers: {
				/* 'X-WP-Nonce': wp.rest_nonce, */
				'Accept': 'application/json'
			},
			body: formData,
		}

		//DEBUG
		console.log( url )
		console.log( fetch_options )


		// Async form submission timeline
		try {

			form_busy = true
			lock_form( form )
			output.style.display = 'flex'

			await popouts_into_dom( output, [ 'Connecting...' ], classes )

			let [ result, ] = await Promise.all( [
				fetch_http_request( url, fetch_options ),
				transition( output, 'opacity', '1' )
			] )
			result.class = ( result.ok ) ? 'success' : 'danger'
			classes = [ ...classes, 'alert-' + result.class ]

			// Animate the popout messages.
			await transition( output, 'opacity', '0' )
			await remove_children( output )
			await popouts_into_dom( output, result.output, classes )
			await transition( output, 'opacity', '1' )
			await pause( 5000 )
			await transition( output, 'opacity', '0' )
			await remove_children( output )

			// Clean up the form.
			if ( result.ok ) {
				let fieldset = form.querySelectorAll( '.form_input' )
				fieldset.forEach( input => { input.value = '' } )
				remove_children( form.querySelector( '.customFileUpload_fileList' ) )
			}
			output.style.display = 'none'
			form_busy = false

		} catch ( error ) {
			console.error( error )
		} finally {
			if( debug ) console.log( stopwatch() + ' | END | handle_form_submit' )
		}

	}


	/**
     * Perform a Fetch request with timeout and json response.
     * 
     * Timeouts:
     *     6s for webserver to SMTP server.
     *     8s for SMTP send response to webserver.
     *     14s for front end as fallback in lieu of server response.
     * 
     * controller - abort controller to abort fetch request.
     * abort - abort wrapped in a timer.
     * signal: controller.signal - attach timeout to fetch request.
     * clearTimeout( timeoutId ) - cancel the timer on response.
     * 
     * @param {string} url      The WP plugin REST endpoint url.
     * @param {object} options  An object of fetch API options.
     * @return {object}         An object of message strings and ok flag.
     * 
     */
	async function fetch_http_request( url, options ) {

		try {
			if( debug ) console.log( `${stopwatch()} |START| Fetch request` )
			const controller = new AbortController()
			const abort = setTimeout( () => controller.abort(), 14000 )
        
			const response = await fetch( url, { ...options, signal: controller.signal } )
			clearTimeout( abort )
			const result = await response.json()
			result.ok = response.ok
			if ( typeof result.output === 'string' ) result.output = [ result.output ]
			if ( ! result.ok ) throw result
			return result

		} catch ( error ) {
            
			if ( ! error.output ) {
				// error is not a server response, so display a generic error.
				error.output = [ 'Failed to establish a connection to the server.' ]
				error.ok = false
			}
			for ( const message in error.output ) {
				console.error( make_human_readable( error.output[ message ] ) )
			}
			return error

		} finally {
			if( debug ) console.log( `${stopwatch()} | END | Fetch request` )
		}
	}


	/**
     * Clean strings for human output.
     * 
     * This function uses regex patterns to clean strings in 3 stages:
     * 
     * 1) Remove all html tags not inside brackets ()
     *      (?<!\([^)]*?) - do not match if preceeded by a '('
     *      <[^>]*?> - match all <>
     * 2) Remove anything that is not:
     *      (\([^\)]*?\)) - content enclosed in ()
     *      ' '   - spaces
     *      \p{L} - letters
     *      \p{N} - numbers
     *      \p{M} - marks (accents etc)
     *      \p{P} - punctuation
     * 3) Trim and replace multiple spaces with a single space.
     * 
     * @link https://www.regular-expressions.info/unicode.html#category
     * @param {string} string The dirty string.
     * @returns The cleaned string.
     * 
     */
	function make_human_readable( string ) {
		const tags = /(?<!\([^)]*?)<[^>]*?>/g
		const human_readable = /(\([^\)]*?\))|[ \p{L}\p{N}\p{M}\p{P}]/ug
		const bad_whitespaces = /^\s*|\s(?=\s)|\s*$/g
		let notags = string.replace( tags, '' )
		let notags_human = notags.match( human_readable ).join( '' )
		let notags_human_clean = notags_human.replace( bad_whitespaces, '' )
		return notags_human_clean
	}


	/**
     * Remove all child nodes from a dom node.
     * 
     * @param {object} parent The dom node to remove all child nodes from.
     * 
     */
	function remove_children( parent ) {

		if( debug ) console.log( `${stopwatch()} |START| remove_children | ${parent.classList}` )
		return new Promise( ( resolve, reject ) => {
			try {
				while ( parent.firstChild ) {
					parent.removeChild( parent.firstChild )
				}
				resolve( 'Child nodes removed successfully.' )
			} catch ( error ) {
				reject( error )
			} finally {
				if( debug ) console.log( `${stopwatch()} | END | remove_children | ${parent.classList}` )
			}
		} )
	}


	/**
     * Helper function to async pause.
     * 
     * @param {integer} milliseconds Duration to pause.
     * 
     */
	function pause( milliseconds ) { 
		return new Promise( ( resolve ) => { 
			setTimeout( () => {
				resolve( 'Pause completed successfully.' )
			}, milliseconds )
		} )
	}


	/**
     * Lock the formfields to prevent editing while the form is processing.
     * 
     * @param {object} form element
     */
	function lock_form( form ) {

		if( debug ) console.log( `${stopwatch()} |START| lock_form | Locked` )

		const button     = form.querySelector( '#' + buttonID )
		const formfields = form.querySelectorAll( '.form_section' )

		formfields.forEach( section => { section.disabled = true } )
		let idle_text = button.innerText
		button.innerText = '[Busy]'

		let unlock_form = setInterval( () => {
			if ( ! form_busy ) {
				clearInterval( unlock_form )
				formfields.forEach( section => { section.disabled = false } )
				button.innerText = idle_text
				if( debug ) console.log( `${stopwatch()} | END | lock_form | Unlocked` )
			}
		}, 250 )
	}


	/**
     * Create an array of popout message elements and insert into dom.
     * 
     * @param {object} parent_element The parent node to append to.
     * @param {array}  message_array An array of messages as strings.
     * @param {array}  classes An array of classes.
     * 
     */
	function popouts_into_dom( parent_element, message_array, class_array ) {

		if( debug ) console.log( `${stopwatch()} |START| popouts_into_dom | ${message_array[ 0 ]}` )
		return new Promise( ( resolve, reject ) => {
			try {
				if ( ! parent_element || parent_element.nodeType !== Node.ELEMENT_NODE ) {
					throw new TypeError( 'parent_element must be an element node.' )
				} else if ( ! is_iterable( message_array ) ) {
					throw new TypeError( `message_array must be non-string iterable. ${typeof message_array} found.` )
				}
				let popouts = []
				message_array.forEach( ( message ) => {
					let p = document.createElement( 'p' )
					p.innerText = make_human_readable( message )
					class_array.forEach( ( class_name ) => {
						p.classList.add( class_name )
					} )
					parent_element.appendChild( p )
					popouts.push( p )
				} )
				resolve( popouts )
			} catch ( error ) {
				reject( error )
			} finally {
				if( debug ) console.log( `${stopwatch()} | END | popouts_into_dom | ${message_array[ 0 ]}` )
			}
		} )
	}


	/**
     * Transition a single element node with a callback on completion.
     *
     * No animation is performed here, this function expects a transition
     * duration to be set in CSS, otherwise the promise will not resolve as
     * no 'transitionend' event will be fired.
     * 
     * Built in event listener was failing due to browser not initialising the
     * new dom node in time for the new event listener. This problem wouldn't
     * exist if the nodes weren't being created/removed on the fly.
     * 
     * @param {object} node Element bound using bind() by caller.
     * @param {string} property The css property to transition.
     * @param {string} value The css value to transition to.
     * @return {Promise} A promise that resolves when the transition is complete.
     * 
     */
	function transition_to_resolve( property, value ) {

		return new Promise( ( resolve, reject ) => {
			try {
				if( debug ) console.log( `${stopwatch()} |START| transition | ${this.classList} : ${property} : ${value}` )
				this.style[ property ] = value

				// Custom event listener to resolve the promise.
				let transition_complete = setInterval( () => {
					let style = getComputedStyle( this )
					if ( style.opacity === value ) {
						clearInterval( transition_complete )
						if( debug ) console.log( `${stopwatch()} | END | transition | ${this.classList} : ${property} : ${value}` )
						resolve( 'Transition complete.' )
					}
				}, 10 )
			} catch ( error ) {
				reject( error )
			}
		} )
	}


	/**
     * Transition node(s) in parallel with resolved promise on completion.
     * Accepts a single node or an array of nodes to provide a common interface
     * for all element transitions.
     * 
     * Expects a transition duration to be set in CSS.
     * 
     * @param {array}  elements An array of elements.
     * @param {string} property The css property to transition.
     * @param {string} value The css value to transition to.
     * @return {Promise} A promise that resolves when all transitions are complete.
     * 
     */
	async function transition( elements, property, value ) {

		if ( ! is_iterable( elements ) ) elements = [ elements ]
		if ( is_iterable( elements )
            && elements.every( ( element ) => { return element.nodeType === 1 } ) ) {
			//we have an array of element nodes.
			const promises = elements.map( ( node ) => transition_to_resolve.bind( node )( property, value ) )
			let result = await Promise.all( promises )
			return result

		} else {
			throw new TypeError( 'elements must be a non-string iterable. ' + typeof elements + ' found.' )
		}
	}


	/**
     * Check if passed variable is iterable.
     * 
     */
	function is_iterable( object ) {
		// checks for null and undefined
		if ( object == null ) {
			return false
		}
		return typeof object[ Symbol.iterator ] === 'function'
	}


	const updateFileList = ( input ) => {
		const output = input.parentElement.nextElementSibling
		const list   = document.createElement( 'ul' )
		remove_children( output )
		output.appendChild( list )
		for ( let i = 0; i < input.files.length; ++i ) {
			list.innerHTML += '<li>' + input.files.item( i ).name + '</li>'
		}
	}



	return (
		<form className={ form } method="post" acceptCharset="utf-8" autoComplete="on">
			<header className="form_section">
				<h3 id="aria_form-title" className="form_title">
					Form Title
				</h3>
				<p id="aria_form-desc" className="form_message">
					Complete and submit the form.
				</p>
			</header>
			<fieldset className="form_section">
				<input
					style={ { display: 'none' } }
					id="saveTheBees"
					name="required_field"
					type="text"
					autoComplete="off"
				/>
				<div className="form_inputWrap form_inputWrap-short">
					<input
						className="form_input"
						name="name"
						type="text"
						maxLength="100"
						title="Name"
						required aria-label="Name"
						placeholder="Name (required)"
						onFocus={ ( e ) => e.target.placeholder='' }
						onBlur={ ( e ) => e.target.placeholder='Name (required)' }
					/>
					<span className="form_flag form_flag-hover"></span>
					<span className="form_flag form_flag-focus"></span>
				</div>
				<div className="form_inputWrap form_inputWrap-short">
					<input
						className="form_input"
						name="email" type="text"
						maxLength="100" title="Email"
						required aria-label="Email"
						placeholder="Email (required)"
						onFocus={ ( e ) => e.target.placeholder='' }
						onBlur={ ( e ) => e.target.placeholder='Email (required)' }
					/>
					<span className="form_flag form_flag-hover"></span>
					<span className="form_flag form_flag-focus"></span>
				</div>
				<div className="form_inputWrap form_inputWrap-wide">
					<textarea
						className="form_input"
						name="message"
						maxLength="5000"
						title="Message"
						rows="8"
						aria-label="Message"
						placeholder="Type your message here..."
						onFocus={ ( e ) => e.target.placeholder='' }
						onBlur={ ( e ) => e.target.placeholder='Type your message...' }
					>
					</textarea>
					<span className="form_flag form_flag-hover"></span>
					<span className="form_flag form_flag-focus"></span>
				</div>

				{ files && (
					<div className="customFileUpload">
						<label>
							<input
								title="Attach a File"
								type="file"
								name="files"
								multiple
								onChange={ ( e ) => updateFileList( e.target ) }
							/>
							<span className="customFileUpload_icon">
								<svg xmlns="http://www.w3.org/2000/svg" height="1em"  viewBox="0 0 512 512">
									<path fill="currentColor" preserveAspectRatio="xMidYMid meet" d="M512 144v288c0 26.5-21.5 48-48 48h-416C21.5 480 0 458.5 0 432v-352C0 53.5 21.5 32 48 32h160l64 64h192C490.5 96 512 117.5 512 144z"/>
								</svg>
							</span>	
							Attach file
						</label>
						<div className="customFileUpload_fileList"></div>
					</div>
				) }
				<Button
					id={ buttonID }
					type={ 'submit' }
					text='submit'
					style='primary'
				>
					Submit
				</Button>
			</fieldset>
			<footer className="form_section">
				<div className="form_output" style={ { display: 'none', opacity: 0 } }></div>
			</footer>
		</form>
	)
}

ContactForm.propTypes = {
	files: PropTypes.bool
}

export default ContactForm
