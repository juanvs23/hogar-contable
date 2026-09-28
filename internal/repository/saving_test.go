package repository

import (
	"path/filepath"
	"testing"

	"hogar-contable/internal/core"
	"hogar-contable/internal/database"
)

func openTestDB(t *testing.T) (*database.DB, func()) {
	t.Helper()
	db, err := database.Open(filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	return db, func() { _ = db.Close() }
}

// The foreign_keys pragma travels in the DSN so every pooled connection
// enforces it. Before this, the pragma ran via Exec on one pooled connection
// only and FK violations (e.g. deleting an account with movements) silently
// orphaned rows.
func TestForeignKeys_EnforcedOnPooledConnections(t *testing.T) {
	db, cleanup := openTestDB(t)
	defer cleanup()

	movRepo := NewSavingMovementRepo(db.DB)

	// Account 999 does not exist: the insert must be rejected.
	if _, err := movRepo.Create(&core.SavingMovement{AccountID: 999, Type: "deposit", AmountUsdt: 1}); err == nil {
		t.Fatal("expected foreign key violation for nonexistent account, got nil")
	}
}

func TestDeleteAccount_RemovesMovements(t *testing.T) {
	db, cleanup := openTestDB(t)
	defer cleanup()

	accRepo := NewSavingAccountRepo(db.DB)
	movRepo := NewSavingMovementRepo(db.DB)

	accID, err := accRepo.Create(&core.SavingAccount{Name: "cuenta test"})
	if err != nil {
		t.Fatalf("create account: %v", err)
	}
	if _, err := movRepo.Create(&core.SavingMovement{AccountID: accID, Type: "deposit", AmountUsdt: 10, AmountBs: 9521}); err != nil {
		t.Fatalf("create movement: %v", err)
	}

	if err := accRepo.Delete(accID); err != nil {
		t.Fatalf("delete account: %v", err)
	}

	var orphanCount int
	err = db.QueryRow(`
		SELECT COUNT(*) FROM saving_movements m
		LEFT JOIN saving_accounts a ON m.account_id = a.id
		WHERE a.id IS NULL`).Scan(&orphanCount)
	if err != nil {
		t.Fatalf("count orphan movements: %v", err)
	}
	if orphanCount != 0 {
		t.Errorf("expected 0 orphan movements after account delete, got %d", orphanCount)
	}

	var accCount int
	if err := db.QueryRow(`SELECT COUNT(*) FROM saving_accounts`).Scan(&accCount); err != nil {
		t.Fatalf("count accounts: %v", err)
	}
	if accCount != 0 {
		t.Errorf("expected 0 accounts after delete, got %d", accCount)
	}
}

func TestDeleteAccount_Nonexistent_StillSucceeds(t *testing.T) {
	db, cleanup := openTestDB(t)
	defer cleanup()

	accRepo := NewSavingAccountRepo(db.DB)
	// Deleting an id that never existed must be a clean no-op, not an error.
	if err := accRepo.Delete(4242); err != nil {
		t.Errorf("expected no-op on deleting nonexistent account, got %v", err)
	}
}
