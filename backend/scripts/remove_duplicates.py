#!/usr/bin/env python3
"""
Script to remove duplicate entries from the database.
Run this script to clean up duplicate RWAs, Flats, and Customers.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.models.rwa import RWA
from app.models.flat import Flat
from app.models.customer import Customer
from sqlalchemy import func, distinct
import uuid

def remove_duplicate_rwas():
    """Remove duplicate RWAs, keeping the first one created."""
    db = SessionLocal()
    try:
        print("🔍 Checking for duplicate RWAs...")
        
        # Find RWAs with duplicate names
        duplicate_names = (
            db.query(RWA.name)
            .group_by(RWA.name)
            .having(func.count(RWA.id) > 1)
            .all()
        )
        
        # Find RWAs with duplicate codes
        duplicate_codes = (
            db.query(RWA.code)
            .group_by(RWA.code)
            .having(func.count(RWA.id) > 1)
            .all()
        )
        
        total_removed = 0
        
        # Remove duplicates by name
        for (name,) in duplicate_names:
            rwas = db.query(RWA).filter(RWA.name == name).order_by(RWA.id).all()
            keep_rwa = rwas[0]  # Keep the first one
            duplicates = rwas[1:]  # Remove the rest
            
            print(f"📍 Found {len(duplicates)} duplicate RWAs with name '{name}'")
            
            for dup_rwa in duplicates:
                # Update any flats that reference this RWA to reference the kept one
                db.query(Flat).filter(Flat.rwa_id == dup_rwa.id).update({Flat.rwa_id: keep_rwa.id})
                
                # Delete the duplicate
                db.delete(dup_rwa)
                total_removed += 1
                print(f"  🗑️ Removed duplicate RWA: {dup_rwa.id}")
        
        # Remove duplicates by code  
        for (code,) in duplicate_codes:
            rwas = db.query(RWA).filter(RWA.code == code).order_by(RWA.id).all()
            if len(rwas) > 1:
                keep_rwa = rwas[0]  # Keep the first one
                duplicates = rwas[1:]  # Remove the rest
                
                print(f"📍 Found {len(duplicates)} duplicate RWAs with code '{code}'")
                
                for dup_rwa in duplicates:
                    # Update any flats that reference this RWA to reference the kept one
                    db.query(Flat).filter(Flat.rwa_id == dup_rwa.id).update({Flat.rwa_id: keep_rwa.id})
                    
                    # Delete the duplicate
                    db.delete(dup_rwa)
                    total_removed += 1
                    print(f"  🗑️ Removed duplicate RWA: {dup_rwa.id}")
        
        db.commit()
        print(f"✅ Removed {total_removed} duplicate RWAs")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error removing duplicate RWAs: {e}")
    finally:
        db.close()

def remove_duplicate_customers():
    """Remove duplicate customers based on email and phone."""
    db = SessionLocal()
    try:
        print("🔍 Checking for duplicate customers...")
        
        # Find customers with duplicate emails
        duplicate_emails = (
            db.query(Customer.email)
            .group_by(Customer.email)
            .having(func.count(Customer.id) > 1)
            .all()
        )
        
        # Find customers with duplicate phones  
        duplicate_phones = (
            db.query(Customer.phone_number)
            .group_by(Customer.phone_number)
            .having(func.count(Customer.id) > 1)
            .all()
        )
        
        total_removed = 0
        
        # Remove duplicates by email
        for (email,) in duplicate_emails:
            if email and email.strip():  # Skip empty emails
                customers = db.query(Customer).filter(Customer.email == email).order_by(Customer.id).all()
                keep_customer = customers[0]  # Keep the first one
                duplicates = customers[1:]  # Remove the rest
                
                print(f"📍 Found {len(duplicates)} duplicate customers with email '{email}'")
                
                for dup_customer in duplicates:
                    # Note: You may want to update any orders/references before deleting
                    db.delete(dup_customer)
                    total_removed += 1
                    print(f"  🗑️ Removed duplicate customer: {dup_customer.id}")
        
        # Remove duplicates by phone
        for (phone,) in duplicate_phones:
            if phone and phone.strip():  # Skip empty phones
                customers = db.query(Customer).filter(Customer.phone_number == phone).order_by(Customer.id).all()
                if len(customers) > 1:
                    keep_customer = customers[0]  # Keep the first one
                    duplicates = customers[1:]  # Remove the rest
                    
                    print(f"📍 Found {len(duplicates)} duplicate customers with phone '{phone}'")
                    
                    for dup_customer in duplicates:
                        # Note: You may want to update any orders/references before deleting
                        db.delete(dup_customer)
                        total_removed += 1
                        print(f"  🗑️ Removed duplicate customer: {dup_customer.id}")
        
        db.commit()
        print(f"✅ Removed {total_removed} duplicate customers")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error removing duplicate customers: {e}")
    finally:
        db.close()

def standardize_rwa_codes():
    """Standardize RWA codes to be unique and follow a pattern."""
    db = SessionLocal()
    try:
        print("🔍 Standardizing RWA codes...")
        
        rwas = db.query(RWA).all()
        used_codes = set()
        
        for rwa in rwas:
            if not rwa.code or rwa.code in used_codes:
                # Generate a new unique code
                base_code = ''.join(word[:3].upper() for word in rwa.name.split()[:2])
                if not base_code:
                    base_code = "RWA"
                
                counter = 1
                new_code = f"{base_code}{counter:03d}"
                while new_code in used_codes:
                    counter += 1
                    new_code = f"{base_code}{counter:03d}"
                
                old_code = rwa.code
                rwa.code = new_code
                used_codes.add(new_code)
                print(f"  📝 Updated RWA '{rwa.name}': '{old_code}' → '{new_code}'")
            else:
                used_codes.add(rwa.code)
        
        db.commit()
        print("✅ RWA codes standardized")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error standardizing RWA codes: {e}")
    finally:
        db.close()

def main():
    print("🧹 Starting duplicate removal process...")
    print("=" * 50)
    
    # Remove duplicates
    remove_duplicate_rwas()
    print()
    remove_duplicate_customers()
    print()
    standardize_rwa_codes()
    
    print("=" * 50)
    print("✅ Duplicate removal completed!")

if __name__ == "__main__":
    main()
