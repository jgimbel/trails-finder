import React, { Component, Fragment } from 'react'
import {Map as LeafletMap, TileLayer, GeoJSON, Popup} from 'react-leaflet'
import styled from 'styled-components'

const Map = styled(LeafletMap)`
  width: 100%;
  height: 100vh;
`

const INACTIVE = {
  color: '#006400',
  weight: 5,
  opacity: 0.65
}
const ACTIVE = {
  color: '#36AB36',
  weight: 10,
  opacity: 0.65
}
const reverse = (arr) => arr.reduce((a, v) => [v, ...a], [])

export default class TrailMap extends Component {
  constructor() {
    super()
    const defaults = (window.location.hash || '').replace('#', '').split(',')
    console.log(defaults)
    let defaultViewport = {zoom: 8, center: [39.09057792387633, -105.2896444872022]}
    let defaultSelected = []
    if(defaults.length >= 2) {
      defaultViewport.center = defaults.slice(0, 2).map(Number)
    }
    if(defaults.length >= 3) {
      defaultViewport.zoom = defaults.slice(2, 3).map(Number)[0]
    }
    if(defaults.length >= 4) {
      defaultSelected = defaults.slice(3)
    }
    this.state = {
      viewport: defaultViewport,
      trails: [],
      selectedTrail: defaultSelected
    }
    console.log(this.state)
  
  }

  async componentDidMount() {
    this.updateTrails(this.state.viewport)
  }

  onViewportChanged = (viewport) => {
    // The viewport got changed by the user, keep track in state
    window.location.hash = `${viewport.center.join(',')},${viewport.zoom}${this.state.selectedTrail.length > 0 ? ','+this.state.selectedTrail.join(',') : ''}`
    this.setState({ viewport })
    this.updateTrails(viewport)
  }

  async updateTrails(viewport) {
    const res = await fetch(`/api/trails?center=${JSON.stringify(reverse(viewport.center))}`)
    if(!res.ok) {
      return console.error(await res.text())
    }
    const trails = await res.json()
    this.setState({trails})
  }

  trailSelect = (evt, id) => {
    console.log(evt)
    const trails = evt.originalEvent.shiftKey 
      ? [...this.state.selectedTrail, id]
      : [id]
    this.setState({ selectedTrail: trails })
    const { viewport } = this.state
    window.location.hash = `${viewport.center.join(',')},${viewport.zoom},${trails.join(',')}`

    // {
    //   color: '#36AB36',
    //   weight: 10,
    //   opacity: 0.65
    // }
  }

  render() {
    const {trails, viewport, selectedTrail} = this.state
    return (
      <Fragment>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.3.1/dist/leaflet.css"
          integrity="sha512-Rksm5RenBEKSKFjgI3a41vrjkw4EVPlJ3+OiI65vTjIdo9brlAacEuKOiQ5OFh7cOI1bkDwLqdLw3Zg0cRJAAQ=="
          crossOrigin="" />
          <Map
            onViewportChanged={this.onViewportChanged}
            viewport={viewport}>

            <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png ' />
            {trails.map(trail => (
              <GeoJSON style={() => selectedTrail.includes(trail._id) ? ACTIVE : INACTIVE} key={trail._id} data={trail} onClick={(evt) => this.trailSelect(evt, trail._id)}>
                <Popup>
                  <div>
                    {trail.properties.TRAIL_NAME || 'No name'}
                    <br/>
                    {trail.properties.GIS_MILES} Mi.
                  </div>
                </Popup>
              </GeoJSON>
            ))}
          </Map>
        </Fragment>
    )
  }
}
