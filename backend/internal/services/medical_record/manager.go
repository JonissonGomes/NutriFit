package medical_record

import (
	"context"

	"nufit/backend/internal/services/anamnesis"
	"nufit/backend/internal/services/anthropometric"
	"nufit/backend/internal/services/lab_exam"
	"nufit/backend/internal/services/questionnaire"
)

type Summary struct {
	PatientID      string        `json:"patientId"`
	Anamnesis      interface{}   `json:"anamnesis,omitempty"`
	Anthropometric []interface{} `json:"anthropometric,omitempty"`
	LabExams       []interface{} `json:"labExams,omitempty"`
	Questionnaires []interface{} `json:"questionnaires,omitempty"`
}

func GetPatientRecord(ctx context.Context, nutritionistID, patientID string) (*Summary, error) {
	summary := &Summary{PatientID: patientID}

	if an, err := anamnesis.GetAnamnesis(ctx, patientID, nutritionistID); err == nil && an != nil {
		summary.Anamnesis = an
	}
	if anth, err := anthropometric.ListByPatient(ctx, patientID, 20); err == nil {
		items := make([]interface{}, len(anth))
		for i := range anth {
			items[i] = anth[i]
		}
		summary.Anthropometric = items
	}
	if labs, err := lab_exam.ListByPatient(ctx, patientID, 20); err == nil {
		items := make([]interface{}, len(labs))
		for i := range labs {
			items[i] = labs[i]
		}
		summary.LabExams = items
	}
	if qs, err := questionnaire.ListByPatient(ctx, patientID, 20); err == nil {
		items := make([]interface{}, len(qs))
		for i := range qs {
			items[i] = qs[i]
		}
		summary.Questionnaires = items
	}
	return summary, nil
}
