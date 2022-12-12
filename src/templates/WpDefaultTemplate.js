import { getImage } from 'gatsby-plugin-image'
import * as React from 'react'
import PropTypes from 'prop-types'
import Layout from '../components/Layout/Layout'
import SimpleBanner from '../components/SimpleBanner/SimpleBanner'

const DefaultTemplate = ( wpPage ) => {

	const featuredImage = ( null !== wpPage.featuredImage )
		? getImage( wpPage.featuredImage.node.localFile.childImageSharp )
		: ''
	const altText = ( '' !== featuredImage )
		? wpPage.featuredImage.node.altText
		: ''

	const { title, content } = wpPage
	return (
		<>
			<Layout>
				<SimpleBanner
					title={ title }
					content={ content }
					image={ featuredImage }
					alt={ altText }
				/>
				<div className="wpPageContent">
					<div
						className="container container_tight"
						dangerouslySetInnerHTML={ { __html: content } }
					/>
				</div>
			</Layout>
		</>
	)
}

DefaultTemplate.propTypes = {
	wpPage: PropTypes.node.isRequired
}

export default DefaultTemplate