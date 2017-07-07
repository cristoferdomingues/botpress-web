/* global: window */

import React from 'react'
import ReactDOM from 'react-dom'
import classnames from 'classnames'
import { Emoji } from 'emoji-mart'
import _ from 'lodash'

import Convo from './convo'
import Side from './side'

import style from './style.scss'

const BOT_HOSTNAME = window.location.origin

const MESSAGES = [ // TEST VALUES
{
  fromUser: false,
  name: 'Dany Fortin-Simard',
  avatar_url: 'https://avatars3.githubusercontent.com/u/5629987?v=3&u=dfd5eb1c9fa2301ece76034b157cef8d38f89022&s=400',
  date: '11:21, Jan 27th, 1991',
  message: {
    type: 'text',
    text: 'Hello!'
  }
},
{
  fromUser: true,
  name: null,
  avatar_url: null,
  date: '11:22, Jan 27th, 1991',
  message: {
    type: 'text',
    text: 'Hi!'
  }
},
{
  fromUser: false,
  name: 'Dany Fortin-Simard',
  avatar_url: 'https://avatars3.githubusercontent.com/u/5629987?v=3&u=dfd5eb1c9fa2301ece76034b157cef8d38f89022&s=400',
  date: '11:33, Jan 27th, 1991',
  message: {
    type: 'text',
    text: 'How are you today?'
  }
}]

export default class Web extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      view: 'convo',
      textToSend: '',
      loading: true,
      conversations: null,
      currentConversation: null,
      currentConversationId: null
    }
  }

  componentWillMount() {
    // Connect the Botpress's Web Socket to the server
    if (this.props.bp && this.props.bp.events) {
      this.props.bp.events.setup()
    }

    this.props.bp.events.on('guest.web.message', event => {
      const isUpdate = this.state.currentConversation
        && this.state.currentConversationId === event.conversationId

      if (!isUpdate) {
        return
      }

      const currentConversation = Object.assign({}, this.state.currentConversation, {
        messages: [...this.state.currentConversation.messages, event]
      })

      this.setState({ currentConversation })
    })

    this.props.bp.events.on('guest.web.pong', function() {
      console.log('PONG!!', arguments)
    })
  }

  componentDidMount() {
    this.fetchConfig()
    .then(::this.fetchData)
    .then(() => {
      this.setState({
        loading: false
      })
    })
  }

  fetchData() {
    return this.fetchConversations()
    .then(::this.fetchCurrentConversation)
  }

  fetchConversations() {
    console.log('---> Fetch conversations...')

    const userId = window.__BP_VISITOR_ID
    const url = `${BOT_HOSTNAME}/api/botpress-web/conversations/${userId}`

    return this.props.bp.axios.get(url)
    .then(({ data }) => {
      this.setState({
        conversations: data
      })
    })
  }

  fetchCurrentConversation() {
    const axios = this.props.bp.axios
    const userId = window.__BP_VISITOR_ID

    let conversationIdToFetch = this.state.currentConversationId
    if (!_.isEmpty(this.state.conversations) && !conversationIdToFetch) {
      conversationIdToFetch = _.first(this.state.conversations).id
      this.setState({ currentConversationId:  conversationIdToFetch })
    }

    const url = `${BOT_HOSTNAME}/api/botpress-web/conversations/${userId}/${conversationIdToFetch}`

    return axios.get(url)
    .then(({data}) => {
      // Possible race condition if the current conversation changed while fetching
      if (this.state.currentConversationId !== conversationIdToFetch) {
        // In which case we simply restart fetching
        return fetchCurrentConversation()
      }

      this.setState({ currentConversation: data })
    })
  }

  fetchMessages() {
    const axios = this.props.bp.axios
    const userId = window.__BP_VISITOR_ID
    const url = `${BOT_HOSTNAME}/api/botpress-web/conversations/${userId}` // TODO

    this.setState({
      messages: MESSAGES
    })

    // return axios.get(url)
    // .then(({data}) => {
      
    // })
  }

  fetchConfig() {
    return this.props.bp.axios.get('/api/botpress-web/config')
    .then(({ data }) => {
      this.setState({
        config: data
      })
    })
  }

  handleSendMessage() {
    const userId = window.__BP_VISITOR_ID
    const url = `${BOT_HOSTNAME}/api/botpress-web/messages/${userId}`

    console.log('---> Sending: ' + this.state.textToSend)

    this.props.bp.axios.post(url, { type: 'text', text: this.state.textToSend })
    .then(() => {
      console.log('---> Message sent OK: ' + this.state.textToSend)
      this.setState({
        view: 'side',
        textToSend: ''
      })
    })
  }

  handleTextChanged(event) {
    this.setState({
      textToSend: event.target.value
    })
  }

  handleAddEmoji(emoji, event) {
    this.setState({
      textToSend: this.state.textToSend + emoji.native + ' '
    })
  }

  handleButtonClicked() {
    if (this.state.view === 'convo') {
      this.setState({
        view: 'widget',
      })
    } else {
      this.setState({
        view: 'side'
      })
    }
  }

  handleClosePanel() {
    this.setState({
      view: 'widget'
    })
  }

  renderOpenIcon() {
    return <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.583 14.894l-3.256 3.78c-.7.813-1.26.598-1.25-.46a10689.413 10689.413 0 0 1 .035-4.775V4.816a3.89 3.89 0 0 1 3.88-3.89h12.064a3.885 3.885 0 0 1 3.882 3.89v6.185a3.89 3.89 0 0 1-3.882 3.89H4.583z" fill="#FFF" fill-rule="evenodd"></path>
    </svg>
  }

  renderCloseIcon() {
    return <svg width="17" height="17" viewBox="0 0 17 17" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.726 15.402c.365.366.365.96 0 1.324-.178.178-.416.274-.663.274-.246 0-.484-.096-.663-.274L8.323 9.648h.353L1.6 16.726c-.177.178-.416.274-.663.274-.246 0-.484-.096-.663-.274-.365-.365-.365-.958 0-1.324L7.35 8.324v.35L.275 1.6C-.09 1.233-.09.64.274.274c.367-.365.96-.365 1.326 0l7.076 7.078h-.353L15.4.274c.366-.365.96-.365 1.326 0 .365.366.365.958 0 1.324L9.65 8.675v-.35l7.076 7.077z" fill="#FFF" fill-rule="evenodd"></path>
      </svg>
  }

  renderButton() {
    return <button
      onClick={::this.handleButtonClicked}
      style={{ backgroundColor: this.state.config.foregroundColor }}>
        <i>{this.state.view === 'convo' ? this.renderCloseIcon() : this.renderOpenIcon()}</i>
      </button>
  }

  renderWidget() {
    return <div className={classnames(style['container'])}>
        <div className={classnames(style['widget-container'])}> 
          <span>
            {this.state.view === 'convo'
              ? <Convo
                change={::this.handleTextChanged}
                send={::this.handleSendMessage}
                config={this.state.config}
                text={this.state.textToSend} /> 
              : null}
            {this.renderButton()}
          </span>
        </div>
      </div>
  }

  renderSide() {
    return <Side
      text={this.state.textToSend}
      close={::this.handleClosePanel}
      send={::this.handleSendMessage}
      change={::this.handleTextChanged}
      currentConversation={this.state.currentConversation}
      conversations={this.state.conversations}
      addEmojiToText={::this.handleAddEmoji}
      config={this.state.config} />
  }

  render() {
    if (this.state.loading) {
      return null
    }

    window.parent.postMessage({ type: 'setClass', value: 'bp-widget-web bp-widget-' + this.state.view }, '*')

    return <div className={style.web} >
        {this.state.view !== 'side' ? this.renderWidget() : this.renderSide()}
      </div>
  }
}
