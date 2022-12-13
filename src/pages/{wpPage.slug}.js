import React from 'react'
import { graphql } from 'gatsby'
import PropTypes from 'prop-types'
import HeadMeta from '../components/HeadMeta'
import DefaultTemplate from '../templates/WpDefaultTemplate'
import FeedTemplate from '../templates/WpFeedTemplate'


const headMeta = ( { data: { wpPage: { title, excerpt } } } ) => {
	return (
		<HeadMeta
			pageTitle={ title }
			pageDescription={ excerpt }
		/>
	)
}

const getPageTemplate = ( wpPage ) => {
	const templateName = wpPage.template.templateName
	switch ( templateName ) {
	case 'Feed':
		return <FeedTemplate { ...wpPage } />

	default:
		return <DefaultTemplate { ...wpPage } />
	}
}

const Page = ( { data: { wpPage } } ) => {
	return <main>{ getPageTemplate( wpPage ) }</main>
}

export const data = graphql`
	query wpPageQuery($id: String) {
		wpPage(id: { eq: $id }) {
			template {
				templateName
			}
			title
			excerpt
			content
			slug
			featuredImage {
				node {
					altText
					localFile {
						childImageSharp {
							gatsbyImageData(
								layout: FULL_WIDTH
								formats: [AUTO, WEBP, AVIF]
								placeholder: BLURRED
							)
						}
					}
				}
			}
		}
	}
`

export const Head = ( data ) => headMeta( data )

export default Page


headMeta.propTypes = {
	data: PropTypes.object.isRequired,
}

getPageTemplate.propTypes = {
	wpPage: PropTypes.node.isRequired
}

Page.propTypes = {
	data: PropTypes.object.isRequired
}