package anthropometric

import "math"

// Protocolos antropométricos suportados.
const (
	ProtocolManual    = "manual"
	ProtocolPollock7  = "pollock_7"
	ProtocolGuedes    = "guedes"
)

// CalculateBodyFatPercent estima % de gordura conforme protocolo e medidas (mm).
func CalculateBodyFatPercent(protocol string, age int, gender string, skinfolds map[string]float64) float64 {
	isMale := gender == "male" || gender == "m" || gender == "masculino"
	switch protocol {
	case ProtocolPollock7:
		sum := skinfolds["triceps"] + skinfolds["subscapular"] + skinfolds["suprailiac"] +
			skinfolds["abdominal"] + skinfolds["thigh"] + skinfolds["chest"] + skinfolds["midaxillary"]
		if sum <= 0 {
			return 0
		}
		density := 1.112 - 0.00043499*sum + 0.00000055*sum*sum - 0.00028826*float64(age)
		if isMale {
			density = 1.112 - 0.00043499*sum + 0.00000055*sum*sum - 0.00028826*float64(age)
		}
		return math.Max(0, (495/density)-450)
	case ProtocolGuedes:
		if isMale {
			sum := skinfolds["triceps"] + skinfolds["suprailiac"] + skinfolds["abdominal"]
			if sum <= 0 {
				return 0
			}
			density := 1.1714 - 0.0671*math.Log10(sum)
			return math.Max(0, (495/density)-450)
		}
		sum := skinfolds["subscapular"] + skinfolds["suprailiac"] + skinfolds["thigh"]
		if sum <= 0 {
			return 0
		}
		density := 1.1665 - 0.0706*math.Log10(sum)
		return math.Max(0, (495/density)-450)
	default:
		return 0
	}
}
