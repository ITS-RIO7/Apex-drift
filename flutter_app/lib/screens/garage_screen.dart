import 'package:flutter/material.dart';
import '../models/car.dart';

class GarageScreen extends StatefulWidget {
  final CarId currentCarId;
  final CarCustomization customization;
  final Function(CarId) onSelectCar;
  final Function(CarCustomization) onUpdateCustomization;

  const GarageScreen({
    super.key,
    required this.currentCarId,
    required this.customization,
    required this.onSelectCar,
    required this.onUpdateCustomization,
  });

  @override
  State<GarageScreen> createState() => _GarageScreenState();
}

class _GarageScreenState extends State<GarageScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late CarId _selectedCar;
  late CarCustomization _custom;

  final List<Map<String, dynamic>> _colors = [
    {'name': 'Estoril Blue', 'color': const Color(0xFF1E40AF)},
    {'name': 'Alpine White', 'color': const Color(0xFFF8FAFC)},
    {'name': 'Toronto Red', 'color': const Color(0xFFDC2626)},
    {'name': 'Isle of Man Green', 'color': const Color(0xFF065F46)},
    {'name': 'Frozen Black', 'color': const Color(0xFF171717)},
    {'name': 'Sunset Pearl', 'color': const Color(0xFFF59E0B)},
    {'name': 'Neon Pink', 'color': const Color(0xFFEC4899)},
  ];

  final List<Map<String, dynamic>> _rimColors = [
    {'name': 'Matte Gold', 'color': const Color(0xFFD4AF37)},
    {'name': 'Bronze', 'color': const Color(0xFF92400E)},
    {'name': 'Silver', 'color': const Color(0xFFCBD5E1)},
    {'name': 'Gloss Black', 'color': const Color(0xFF0F172A)},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _selectedCar = widget.currentCarId;
    _custom = widget.customization;
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF090D16),
      appBar: AppBar(
        backgroundColor: const Color(0xFF050814),
        title: const Text(
          'M-PERFORMANCE DRIFT GARAGE',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w900,
            fontSize: 16,
            letterSpacing: 1.2,
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF06B6D4),
          labelColor: const Color(0xFF06B6D4),
          unselectedLabelColor: Colors.white60,
          tabs: const [
            Tab(text: 'VEHICLES'),
            Tab(text: 'LIVERY & PAINT'),
            Tab(text: 'DRIFT TUNING'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // 1. CAR SELECTION
          ListView(
            padding: const EdgeInsets.all(16),
            children: carCatalog.entries.map((entry) {
              final c = entry.value;
              final isSelected = c.id == _selectedCar;

              return Card(
                color: isSelected ? const Color(0xFF1E293B) : const Color(0xFF0F172A),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(
                    color: isSelected ? const Color(0xFF06B6D4) : Colors.white10,
                    width: isSelected ? 2 : 1,
                  ),
                ),
                margin: const EdgeInsets.only(bottom: 12),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${c.brand} · ${c.year}',
                            style: const TextStyle(
                              color: Color(0xFF38BDF8),
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                          if (isSelected)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFF06B6D4),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text(
                                'EQUIPPED',
                                style: TextStyle(
                                  color: Colors.black,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 10,
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        c.name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 18,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        c.description,
                        style: const TextStyle(color: Colors.white60, fontSize: 12),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _buildStatItem('POWER', '${c.horsepower} HP'),
                          _buildStatItem('TOP SPEED', '${c.topSpeed.floor()} KM/H'),
                          _buildStatItem('DRIFT EASE', '${c.driftEase}%'),
                        ],
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {
                            setState(() {
                              _selectedCar = c.id;
                              _custom.bodyColor = c.defaultColor;
                              _custom.rimColor = c.defaultRimColor;
                            });
                            widget.onSelectCar(c.id);
                            widget.onUpdateCustomization(_custom);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: isSelected ? const Color(0xFF06B6D4) : Colors.white12,
                            foregroundColor: isSelected ? Colors.black : Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          child: Text(isSelected ? 'READY TO DRIFT' : 'SELECT VEHICLE'),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),

          // 2. LIVERY & PAINT
          ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const Text(
                'BODY PAINT COLOR',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: _colors.map((item) {
                  final Color col = item['color'];
                  final bool active = _custom.bodyColor == col;
                  return GestureDetector(
                    onTap: () {
                      setState(() => _custom.bodyColor = col);
                      widget.onUpdateCustomization(_custom);
                    },
                    child: Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        color: col,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: active ? const Color(0xFF06B6D4) : Colors.white24,
                          width: active ? 3 : 1,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),
              const Text(
                'WHEEL RIM COLOR',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: _rimColors.map((item) {
                  final Color col = item['color'];
                  final bool active = _custom.rimColor == col;
                  return GestureDetector(
                    onTap: () {
                      setState(() => _custom.rimColor = col);
                      widget.onUpdateCustomization(_custom);
                    },
                    child: Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        color: col,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: active ? const Color(0xFF06B6D4) : Colors.white24,
                          width: active ? 3 : 1,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ),

          // 3. DRIFT TUNING
          ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(
                'STEERING LOCK ANGLE: ${_custom.steerAngle.floor()}°',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
              Slider(
                value: _custom.steerAngle,
                min: 40.0,
                max: 65.0,
                activeColor: const Color(0xFF06B6D4),
                onChanged: (val) {
                  setState(() => _custom.steerAngle = val);
                  widget.onUpdateCustomization(_custom);
                },
              ),
              const SizedBox(height: 16),
              Text(
                'SUSPENSION STIFFNESS: ${_custom.suspensionStiffness.toStringAsFixed(1)}x',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
              Slider(
                value: _custom.suspensionStiffness,
                min: 0.6,
                max: 1.6,
                activeColor: const Color(0xFF06B6D4),
                onChanged: (val) {
                  setState(() => _custom.suspensionStiffness = val);
                  widget.onUpdateCustomization(_custom);
                },
              ),
              const SizedBox(height: 16),
              SwitchListTile(
                title: const Text('DRIFT TRACTION ASSIST', style: TextStyle(color: Colors.white)),
                subtitle: const Text('Helps counter-steer automatically', style: TextStyle(color: Colors.white60)),
                value: _custom.driftAssist,
                activeColor: const Color(0xFF06B6D4),
                onChanged: (val) {
                  setState(() => _custom.driftAssist = val);
                  widget.onUpdateCustomization(_custom);
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(label, style: const TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold)),
        const SizedBox(height: 2),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w900)),
      ],
    );
  }
}
