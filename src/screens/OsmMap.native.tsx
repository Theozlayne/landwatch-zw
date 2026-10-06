import MapView, { Marker, UrlTile } from 'react-native-maps';
import { StyleSheet, Text, View } from 'react-native';

export default function OsmMap({ height, reports = [] }: { height: number; reports?: Array<{ latitude?: number | null; longitude?: number | null; status?: string }> }) {
  const locatedReports = reports.filter((report) => report.latitude !== null && report.latitude !== undefined && report.longitude !== null && report.longitude !== undefined);
  const center = locatedReports[0] ?? { latitude: -19.455, longitude: 29.82 };
  return <View style={[styles.frame, { height }]}><MapView style={StyleSheet.absoluteFillObject} initialRegion={{ latitude: center.latitude as number, longitude: center.longitude as number, latitudeDelta: 0.08, longitudeDelta: 0.08 }} showsCompass showsScale><UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} flipY={false} />{locatedReports.map((report, index) => <Marker key={`${report.latitude}-${report.longitude}-${index}`} coordinate={{ latitude: report.latitude as number, longitude: report.longitude as number }} title="Your reported activity" description={`Approximate location - ${report.status ?? 'Submitted'}`} pinColor={report.status === 'Resolved' ? '#0E5232' : '#B3261E'} />)}</MapView><View style={styles.attribution}><Text style={styles.attributionText}>© OpenStreetMap contributors</Text></View></View>;
}

const styles = StyleSheet.create({ frame: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#D5DADD', position: 'relative' }, attribution: { position: 'absolute', right: 8, bottom: 7, backgroundColor: 'rgba(255,255,255,0.84)', paddingHorizontal: 5, paddingVertical: 2 }, attributionText: { color: '#47525A', fontSize: 8 } });
