import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import { Input, Button, Panel, Grid, Row, Col, Jumbotron } from 'react-bootstrap';
import { GoogleMapLoader, GoogleMap, Marker } from "react-google-maps";
import vehicleMonitor from '../../services/vehicleMonitor'

export class View extends Component {

    constructor(props) {
        super(props);
        this.state = { icons: {} };
    }
    
    componentDidMount() {
        vehicleMonitor.startListening();
    }

    componentWillUnmount() {
        vehicleMonitor.stopListening();
    }

    vehicleIcon(id) {
        if (this.state.icons[id]) {
            return this.state.icons[id];
        }
        const icon = '~/img/marker_' + Object.keys(this.state.icons).length + '.png';
        this.state.icons[id] = icon;
        return icon;
    }

    render() {

        var list = this.props.vehicles.map((vehicle, index) => (
            <div key={vehicle.id}><img src={this.vehicleIcon(vehicle.id)} /> { vehicle.name }: { vehicle.state } </div>
        ));

        return (

              <Grid>
                <Row className="show-grid">
                    <Col xs={12} md={8}>
                        <div style={{height: "500px", width: "100%", background: "yellow" }}>
                            <GoogleMapLoader
                                containerElement={ <div style={{height: "100%"}} /> }
                                googleMapElement={ 
                                    <GoogleMap 
                                        defaultZoom={6} 
                                        defaultCenter={{lat: 50.05008478, lng: 9.89868164}}> 
                                        {this.props.vehicles.map((vehicle, index) => {
                                            return (
                                                <Marker 
                                                    position={{ lat: vehicle.latitude, lng: vehicle.longitude }}
                                                    key={ vehicle.id }
                                                    title={ vehicle.name}
                                                    
                                                    />
                                                  );
                                        })}
                                    </GoogleMap> 
                                }
                            />
                        </div>
                    </Col>
                    <Col xs={12} md={4}>
                        <ul>
                            {list}
                        </ul>
                    </Col>
                </Row>
            </Grid>
        );
    }
}

View.propTypes = {
    vehicles: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        state: PropTypes.string.isRequired,
        latitude: PropTypes.number,
        longitude: PropTypes.number
    }))
};

export function mapStateToProps(state, props) {
    let vehicles = Object.keys(state.vehicles).map(function (key) { return state.vehicles[key] });
    return {
        vehicles: vehicles
    };
}

export default connect(mapStateToProps)(View);