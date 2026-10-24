import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'models/car.dart';
import 'models/map_data.dart';
import 'screens/title_screen.dart';
import 'screens/game_screen.dart';
import 'screens/garage_screen.dart';
import 'screens/map_selector_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);
  runApp(const ApexDriftApp());
}

class ApexDriftApp extends StatelessWidget {
  const ApexDriftApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Apex Drift 3D',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF050814),
        fontFamily: 'Roboto',
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF06B6D4),
          secondary: Color(0xFF38BDF8),
          surface: Color(0xFF090D16),
        ),
      ),
      home: const MainNavigationShell(),
    );
  }
}

class MainNavigationShell extends StatefulWidget {
  const MainNavigationShell({super.key});

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  CarId _carId = CarId.bmwM4;
  MapId _mapId = MapId.city;
  bool _isPlaying = false;
  late CarCustomization _customization;

  @override
  void initState() {
    super.initState();
    final c = carCatalog[_carId]!;
    _customization = CarCustomization(
      bodyColor: c.defaultColor,
      rimColor: c.defaultRimColor,
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isPlaying) {
      return GameScreen(
        initialCarId: _carId,
        initialMapId: _mapId,
        onReturnToTitle: () => setState(() => _isPlaying = false),
      );
    }

    return TitleScreen(
      currentCarId: _carId,
      currentMapId: _mapId,
      onStartGame: () => setState(() => _isPlaying = true),
      onOpenGarage: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => GarageScreen(
              currentCarId: _carId,
              customization: _customization,
              onSelectCar: (c) => setState(() => _carId = c),
              onUpdateCustomization: (cust) => setState(() => _customization = cust),
            ),
          ),
        );
      },
      onOpenMapSelector: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => MapSelectorScreen(
              currentMapId: _mapId,
              onSelectMap: (m) => setState(() => _mapId = m),
            ),
          ),
        );
      },
    );
  }
}
