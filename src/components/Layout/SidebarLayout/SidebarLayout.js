import React from 'react'
import PropTypes from 'prop-types'
import Header from 'components/Header/Header'
import Sidebar from 'components/Sidebar/Sidebar'
import TagCloud from 'components/TagCloud/TagCloud'
import Footer from 'components/Footer/Footer'
import {
	layout,
	main
} from './SidebarLayout.module.scss'

const SidebarLayout = ( { children } ) => {
	return (
		<div className={ layout }>
			<Header sticky />
			<main className={ main }>
				{ children }
			</main>
			<Sidebar>
				<TagCloud />
			</Sidebar>
			<Footer />
		</div>
	)
}

SidebarLayout.propTypes = {
	children: PropTypes.node.isRequired
}

export default SidebarLayout
