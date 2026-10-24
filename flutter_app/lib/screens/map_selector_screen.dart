import 'package:flutter/material.dart';
import '../models/map_data.dart';

class MapSelectorScreen extends StatelessWidget {
  final MapId currentMapId;
  final Function(MapId) onSelectMap;

  const MapSelectorScreen({
    super.key,
    required this.currentMapId,
    required this.onSelectMap,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF090D16),
      appBar: AppBar(
        backgroundColor: const Color(0xFF050814),
        title: const Text(
          'SELECT DRIFT LOCATION',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w900,
            fontSize: 16,
            letterSpacing: 1.2,
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: mapCatalog.entries.map((entry) {
          final m = entry.value;
          final isSelected = m.id == currentMapId;

          return Card(
            color: isSelected ? const Color(0xFF1E293B) : const Color(0xFF0F172A),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(
                color: isSelected ? const Color(0xFF06B6D4) : Colors.white10,
                width: isSelected ? 2 : 1,
              ),
            ),
            margin: const EdgeInsets.only(bottom: 14),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFF06B6D4),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          m.difficulty.name.toUpperCase(),
                          style: const TextStyle(
                            color: Colors.black,
                            fontWeight: FontWeight.bold,
                            fontSize: 10,
                          ),
                        ),
                      ),
                      Text(
                        'Target: ${m.driftTargetScore} pts',
                        style: const TextStyle(color: Colors.white60, fontSize: 11),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    m.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 18,
                    ),
                  ),
                  Text(
                    m.subtitle,
                    style: const TextStyle(color: Color(0xFF38BDF8), fontSize: 12),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    m.description,
                    style: const TextStyle(color: Colors.white60, fontSize: 12),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        onSelectMap(m.id);
                        Navigator.pop(context);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isSelected ? const Color(0xFF06B6D4) : Colors.white12,
                        foregroundColor: isSelected ? Colors.black : Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: Text(isSelected ? 'CURRENTLY LOADED' : 'ENTER LOCATION'),
                    ),
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
