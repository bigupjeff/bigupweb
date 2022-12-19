import * as React from 'react'
import { Link } from 'gatsby'
import useWpFooterMenu from 'hooks/useWpFooterMenu'
import Fullstop from 'components/Fullstop/Fullstop'
import { useSiteMetadata } from 'hooks/useSiteMetadata'
import {
	FaFacebookSquare as Facebook,
	FaTwitterSquare as Twitter,
	FaInstagram as Instagram,
	FaLinkedin as Linkedin,
} from 'react-icons/fa'
import {
	footer,
	container,
	footer_menu,
	social,
	copyright,
} from './Footer.module.scss'

const Footer = () => {
	const {
		twitterUsername,
		facebookUsername,
		instagramUsername,
		linkedinUsername,
		developerUrl,
		developerName
	} = useSiteMetadata()
	const footerLinks  = useWpFooterMenu()

	return (
		<footer style={ { marginBottom: 0 } } className={ footer }>
			<div className={ container }>
				<div className={ footer_menu }>
					<h5>Links</h5>
					<ul>
						{ footerLinks.map( ( node, index ) => {
							return (
								<li key={ index }>
									<Link
										to={ node.uri }
										activeClassName="menu_item--active"
									>
										{ node.label }
										<Fullstop />
									</Link>
								</li>
							)
						} ) }
					</ul>
				</div>
				{ twitterUsername ||
				facebookUsername ||
				instagramUsername ||
				linkedinUsername ? (
						<div className={ `${footer_menu} ${social}` }>
							<h5>
							Follow Bigup Web<span>.</span>
							</h5>
							<ul>
								{ twitterUsername && (
									<li>
										<a
											href={ `https://www.twitter.com/${twitterUsername}` }
											target="_blank"
											rel="nofollow noreferrer noopener"
										>
											<Twitter />
										</a>
									</li>
								) }
								{ facebookUsername && (
									<li>
										<a
											href={ `https://www.facebook.com/${facebookUsername}` }
											target="_blank"
											rel="nofollow noreferrer noopener"
										>
											<Facebook />
										</a>
									</li>
								) }
								{ instagramUsername && (
									<li>
										<a
											href={ `https://www.instagram.com/${instagramUsername}` }
											target="_blank"
											rel="nofollow noreferrer noopener"
										>
											<Instagram />
										</a>
									</li>
								) }
								{ linkedinUsername && (
									<li>
										<a
											href={ `https://www.linkedin.com/${linkedinUsername}` }
											target="_blank"
											rel="nofollow noreferrer noopener"
										>
											<Linkedin />
										</a>
									</li>
								) }
							</ul>
						</div>
					) : (
						''
					) }
			</div>
			<div className={ copyright }>
				<p>
					Designed & developed by{ ' ' }
					<a
						href={ developerUrl }
						target="_blank"
						rel="noopener noreferrer"
					>
						{ developerName }
					</a>
					<span>.</span>
				</p>
			</div>
		</footer>
	)
}

export default Footer
