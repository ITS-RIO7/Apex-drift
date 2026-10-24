import 'package:flutter/material.dart';

enum CarId {
  bmwM4,
  bmwE30,
  silviaS15,
  apexGt,
}

enum PaintFinish {
  metallic,
  gloss,
  matte,
}

enum SpoilerStyle {
  gtWing,
  ducktail,
  stock,
}

class CarSpecs {
  final CarId id;
  final String name;
  final String brand;
  final String year;
  final String description;
  final double topSpeed; // km/h
  final double acceleration; // 0-100 factor
  final int handling;
  final int driftEase;
  final int horsepower;
  final int weight;
  final Color defaultColor;
  final Color defaultRimColor;
  final int price;

  const CarSpecs({
    required this.id,
    required this.name,
    required this.brand,
    required this.year,
    required this.description,
    required this.topSpeed,
    required this.acceleration,
    required this.handling,
    required this.driftEase,
    required this.horsepower,
    required this.weight,
    required this.defaultColor,
    required this.defaultRimColor,
    required this.price,
  });
}

class CarCustomization {
  Color bodyColor;
  PaintFinish finish;
  Color rimColor;
  Color smokeColor;
  SpoilerStyle spoilerStyle;
  double steerAngle; // 40 - 65 degrees
  double suspensionStiffness; // 0.6 - 1.6
  bool driftAssist;

  CarCustomization({
    required this.bodyColor,
    this.finish = PaintFinish.metallic,
    required this.rimColor,
    this.smokeColor = const Color(0xFFFFFFFF),
    this.spoilerStyle = SpoilerStyle.gtWing,
    this.steerAngle = 50.0,
    this.suspensionStiffness = 1.0,
    this.driftAssist = false,
  });

  CarCustomization copyWith({
    Color? bodyColor,
    PaintFinish? finish,
    Color? rimColor,
    Color? smokeColor,
    SpoilerStyle? spoilerStyle,
    double? steerAngle,
    double? suspensionStiffness,
    bool? driftAssist,
  }) {
    return CarCustomization(
      bodyColor: bodyColor ?? this.bodyColor,
      finish: finish ?? this.finish,
      rimColor: rimColor ?? this.rimColor,
      smokeColor: smokeColor ?? this.smokeColor,
      spoilerStyle: spoilerStyle ?? this.spoilerStyle,
      steerAngle: steerAngle ?? this.steerAngle,
      suspensionStiffness: suspensionStiffness ?? this.suspensionStiffness,
      driftAssist: driftAssist ?? this.driftAssist,
    );
  }
}

const Map<CarId, CarSpecs> carCatalog = {
  CarId.bmwM4: CarSpecs(
    id: CarId.bmwM4,
    name: 'Bavarian M4 Drift GT',
    brand: 'Bavaria M-Sport',
    year: '2024',
    description: 'Twin-turbo inline-6 beast with tuned limited-slip differential and aggressive twin kidney grille styling. Pure drift perfection.',
    topSpeed: 290.0,
    acceleration: 3.4,
    handling: 92,
    driftEase: 95,
    horsepower: 680,
    weight: 1580,
    defaultColor: Color(0xFF1E40AF), // Estoril Blue
    defaultRimColor: Color(0xFFD4AF37), // Matte Gold
    price: 0,
  ),
  CarId.bmwE30: CarSpecs(
    id: CarId.bmwE30,
    name: 'Bavarian E30 Classic King',
    brand: 'Bavaria Heritage',
    year: '1989',
    description: 'The legendary lightweight boxy coupe. Ultra-balanced chassis, high-revving naturally aspirated engine, and instant slide control.',
    topSpeed: 255.0,
    acceleration: 4.1,
    handling: 96,
    driftEase: 90,
    horsepower: 490,
    weight: 1140,
    defaultColor: Color(0xFFDC2626), // Alpine Red
    defaultRimColor: Color(0xFFCBD5E1), // Silver
    price: 15000,
  ),
  CarId.silviaS15: CarSpecs(
    id: CarId.silviaS15,
    name: 'Silvia S-Drift Spec-R',
    brand: 'Nippon Performance',
    year: '2002',
    description: 'The undisputed Touge drift icon. SR20DET turbo punch, high steering lock angle, and effortless transition snaps.',
    topSpeed: 275.0,
    acceleration: 3.8,
    handling: 94,
    driftEase: 98,
    horsepower: 540,
    weight: 1220,
    defaultColor: Color(0xFFF59E0B), // Sunset Pearl
    defaultRimColor: Color(0xFF0F172A), // Gloss Black
    price: 28000,
  ),
  CarId.apexGt: CarSpecs(
    id: CarId.apexGt,
    name: 'Apex GT Hyper-Slide',
    brand: 'Apex Racing Division',
    year: '2025',
    description: 'Carbon-chassis hyper drift concept. Extreme downforce, 850 horsepower twin-turbo V8, and razor-sharp throttle control.',
    topSpeed: 330.0,
    acceleration: 2.8,
    handling: 90,
    driftEase: 92,
    horsepower: 850,
    weight: 1350,
    defaultColor: Color(0xFF059669), // Emerald Neon
    defaultRimColor: Color(0xFF92400E), // Bronze
    price: 50000,
  ),
};
