"""
Script de test et debug des endpoints API
Teste tous les endpoints critiques et signale les erreurs
"""
import asyncio
import httpx
import json
from datetime import datetime, timedelta
from typing import Optional
import sys


# Configuration
BASE_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = "arij@admin.com"
OWNER_EMAIL = "arij@owner.com"
PASSWORD = "password123"

# Couleurs pour output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'
    BOLD = '\033[1m'


class APITester:
    def __init__(self):
        self.admin_token: Optional[str] = None
        self.owner_token: Optional[str] = None
        self.test_results = []
        self.agency_id = None
        self.vehicle_id = None
        self.customer_id = None
        self.booking_id = None
        
    async def login(self, email: str, password: str) -> Optional[str]:
        """Se connecter et récupérer le token"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{BASE_URL}/auth/login",
                    json={"email": email, "password": password}
                )
                if response.status_code == 200:
                    data = response.json()
                    return data.get("access_token")
                else:
                    print(f"{Colors.RED}❌ Login failed for {email}: {response.status_code}{Colors.END}")
                    print(f"   Response: {response.text}")
                    return None
            except Exception as e:
                print(f"{Colors.RED}❌ Login error for {email}: {str(e)}{Colors.END}")
                return None
    
    def log_test(self, name: str, success: bool, message: str = ""):
        """Enregistrer résultat de test"""
        self.test_results.append({
            "name": name,
            "success": success,
            "message": message
        })
        icon = f"{Colors.GREEN}✓{Colors.END}" if success else f"{Colors.RED}✗{Colors.END}"
        status = f"{Colors.GREEN}PASS{Colors.END}" if success else f"{Colors.RED}FAIL{Colors.END}"
        print(f"{icon} {name}: {status}")
        if message:
            print(f"   {message}")
    
    async def test_endpoint(self, name: str, method: str, endpoint: str, 
                          token: str, data: dict = None, params: dict = None):
        """Tester un endpoint générique"""
        async with httpx.AsyncClient() as client:
            try:
                headers = {"Authorization": f"Bearer {token}"}
                
                if method == "GET":
                    response = await client.get(f"{BASE_URL}{endpoint}", headers=headers, params=params)
                elif method == "POST":
                    response = await client.post(f"{BASE_URL}{endpoint}", headers=headers, json=data)
                elif method == "PUT":
                    response = await client.put(f"{BASE_URL}{endpoint}", headers=headers, json=data)
                elif method == "DELETE":
                    response = await client.delete(f"{BASE_URL}{endpoint}", headers=headers)
                else:
                    self.log_test(name, False, f"Unsupported method: {method}")
                    return None
                
                if response.status_code in [200, 201]:
                    self.log_test(name, True, f"Status: {response.status_code}")
                    return response.json()
                else:
                    self.log_test(name, False, f"Status: {response.status_code} - {response.text[:100]}")
                    return None
                    
            except Exception as e:
                self.log_test(name, False, f"Exception: {str(e)}")
                return None
    
    async def run_auth_tests(self):
        """Tests d'authentification"""
        print(f"\n{Colors.BOLD}{'='*60}{Colors.END}")
        print(f"{Colors.BOLD}🔐 TESTS AUTHENTIFICATION{Colors.END}")
        print(f"{Colors.BOLD}{'='*60}{Colors.END}\n")
        
        # Login admin
        self.admin_token = await self.login(ADMIN_EMAIL, PASSWORD)
        self.log_test("Admin Login", self.admin_token is not None)
        
        # Login owner
        self.owner_token = await self.login(OWNER_EMAIL, PASSWORD)
        self.log_test("Owner Login", self.owner_token is not None)
    
    async def run_agency_tests(self):
        """Tests gestion agences"""
        print(f"\n{Colors.BOLD}{'='*60}{Colors.END}")
        print(f"{Colors.BOLD}🏢 TESTS GESTION AGENCES{Colors.END}")
        print(f"{Colors.BOLD}{'='*60}{Colors.END}\n")
        
        if not self.admin_token:
            print(f"{Colors.YELLOW}⚠ Skipping agency tests (no admin token){Colors.END}")
            return
        
        # List agencies
        agencies = await self.test_endpoint(
            "List Agencies",
            "GET",
            "/admin/agencies",
            self.admin_token
        )
        
        if agencies and len(agencies) > 0:
            self.agency_id = agencies[0].get("id")
            self.log_test("Get Agency ID", True, f"Agency ID: {self.agency_id}")
        
        # Get agency statistics
        if self.agency_id:
            await self.test_endpoint(
                "Agency Statistics",
                "GET",
                f"/admin/agencies/{self.agency_id}/statistics",
                self.admin_token
            )
    
    async def run_vehicle_tests(self):
        """Tests gestion véhicules"""
        print(f"\n{Colors.BOLD}{'='*60}{Colors.END}")
        print(f"{Colors.BOLD}🚗 TESTS GESTION VÉHICULES{Colors.END}")
        print(f"{Colors.BOLD}{'='*60}{Colors.END}\n")
        
        if not self.owner_token or not self.agency_id:
            print(f"{Colors.YELLOW}⚠ Skipping vehicle tests (no token or agency){Colors.END}")
            return
        
        # List vehicles
        result = await self.test_endpoint(
            "List Vehicles",
            "GET",
            "/vehicles/",
            self.owner_token,
            params={"agency_id": self.agency_id}
        )
        
        if result and result.get("vehicles"):
            vehicles = result["vehicles"]
            if len(vehicles) > 0:
                self.vehicle_id = vehicles[0].get("id")
                self.log_test("Get Vehicle ID", True, f"Vehicle ID: {self.vehicle_id}")
        
        # Get vehicle details
        if self.vehicle_id:
            await self.test_endpoint(
                "Vehicle Details",
                "GET",
                f"/vehicles/{self.vehicle_id}",
                self.owner_token,
                params={"agency_id": self.agency_id}
            )
        
        # Create vehicle (test)
        new_vehicle = {
            "immatriculation": f"TEST{datetime.now().strftime('%H%M%S')}",
            "marque": "TestBrand",
            "modele": "TestModel",
            "annee": 2023,
            "couleur": "Bleu",
            "numero_chassis": f"TEST{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "type_carburant": "essence",
            "transmission": "manuelle",
            "nombre_places": 5,
            "categorie": "compacte",
            "kilometrage": 10000,
            "tarif_journalier": 80.00,
            "statut": "disponible"
        }
        
        created = await self.test_endpoint(
            "Create Vehicle",
            "POST",
            "/vehicles/",
            self.owner_token,
            data=new_vehicle,
            params={"agency_id": self.agency_id}
        )
        
        # Delete test vehicle
        if created:
            test_vehicle_id = created.get("id")
            await self.test_endpoint(
                "Delete Test Vehicle",
                "DELETE",
                f"/vehicles/{test_vehicle_id}",
                self.owner_token,
                params={"agency_id": self.agency_id}
            )
    
    async def run_customer_tests(self):
        """Tests gestion clients"""
        print(f"\n{Colors.BOLD}{'='*60}{Colors.END}")
        print(f"{Colors.BOLD}👥 TESTS GESTION CLIENTS{Colors.END}")
        print(f"{Colors.BOLD}{'='*60}{Colors.END}\n")
        
        if not self.owner_token or not self.agency_id:
            print(f"{Colors.YELLOW}⚠ Skipping customer tests (no token or agency){Colors.END}")
            return
        
        # List customers
        result = await self.test_endpoint(
            "List Customers",
            "GET",
            "/customers/",
            self.owner_token,
            params={"agency_id": self.agency_id}
        )
        
        if result:
            # Handle both list and dict responses
            customers = result if isinstance(result, list) else (result.get("customers") if isinstance(result, dict) else [])
            if customers and len(customers) > 0:
                customer = customers[0]
                self.customer_id = customer.get("id") if isinstance(customer, dict) else customer
                self.log_test("Get Customer ID", True, f"Customer ID: {self.customer_id}")
        
        # Get customer details
        if self.customer_id:
            await self.test_endpoint(
                "Customer Details",
                "GET",
                f"/customers/{self.customer_id}",
                self.owner_token,
                params={"agency_id": self.agency_id}
            )
    
    async def run_booking_tests(self):
        """Tests gestion réservations"""
        print(f"\n{Colors.BOLD}{'='*60}{Colors.END}")
        print(f"{Colors.BOLD}📅 TESTS GESTION RÉSERVATIONS{Colors.END}")
        print(f"{Colors.BOLD}{'='*60}{Colors.END}\n")
        
        if not self.owner_token or not self.agency_id:
            print(f"{Colors.YELLOW}⚠ Skipping booking tests (no token or agency){Colors.END}")
            return
        
        # List bookings
        result = await self.test_endpoint(
            "List Bookings",
            "GET",
            "/bookings/",
            self.owner_token,
            params={"agency_id": self.agency_id}
        )
        
        if result:
            # Handle both list and dict responses
            bookings = result if isinstance(result, list) else (result.get("bookings") if isinstance(result, dict) else [])
            if bookings and len(bookings) > 0:
                booking = bookings[0]
                self.booking_id = booking.get("id") if isinstance(booking, dict) else booking
                self.log_test("Get Booking ID", True, f"Booking ID: {self.booking_id}")
        
        # Get booking details
        if self.booking_id:
            await self.test_endpoint(
                "Booking Details",
                "GET",
                f"/bookings/{self.booking_id}",
                self.owner_token,
                params={"agency_id": self.agency_id}
            )
        
        # Check availability
        if self.vehicle_id:
            availability_data = {
                "vehicle_id": self.vehicle_id,
                "date_debut": (datetime.now() + timedelta(days=1)).isoformat(),
                "date_fin": (datetime.now() + timedelta(days=3)).isoformat()
            }
            await self.test_endpoint(
                "Check Availability",
                "POST",
                "/bookings/check-availability",
                self.owner_token,
                data=availability_data,
                params={"agency_id": self.agency_id}
            )
    
    async def run_contract_tests(self):
        """Tests gestion contrats"""
        print(f"\n{Colors.BOLD}{'='*60}{Colors.END}")
        print(f"{Colors.BOLD}📄 TESTS GESTION CONTRATS{Colors.END}")
        print(f"{Colors.BOLD}{'='*60}{Colors.END}\n")
        
        if not self.owner_token or not self.agency_id:
            print(f"{Colors.YELLOW}⚠ Skipping contract tests (no token or agency){Colors.END}")
            return
        
        # List contracts
        result = await self.test_endpoint(
            "List Contracts",
            "GET",
            "/contracts/",
            self.owner_token,
            params={"agency_id": self.agency_id}
        )
        
        if result:
            # Handle both list and dict responses
            contracts = result if isinstance(result, list) else (result.get("contracts") if isinstance(result, dict) else [])
            if contracts and len(contracts) > 0:
                contract = contracts[0]
                self.contract_id = contract.get("id") if isinstance(contract, dict) else contract
                self.log_test("Get Contract ID", True, f"Contract ID: {contract_id}")
                
                # Get contract details
                await self.test_endpoint(
                    "Contract Details",
                    "GET",
                    f"/contracts/{contract_id}",
                    self.owner_token,
                    params={"agency_id": self.agency_id}
                )
    
    async def run_payment_tests(self):
        """Tests gestion paiements"""
        print(f"\n{Colors.BOLD}{'='*60}{Colors.END}")
        print(f"{Colors.BOLD}💳 TESTS GESTION PAIEMENTS{Colors.END}")
        print(f"{Colors.BOLD}{'='*60}{Colors.END}\n")
        
        if not self.owner_token or not self.agency_id:
            print(f"{Colors.YELLOW}⚠ Skipping payment tests (no token or agency){Colors.END}")
            return
        
        # List payments
        await self.test_endpoint(
            "List Payments",
            "GET",
            "/payments/",
            self.owner_token,
            params={"agency_id": self.agency_id}
        )
    
    def print_summary(self):
        """Afficher résumé des tests"""
        print(f"\n{Colors.BOLD}{'='*60}{Colors.END}")
        print(f"{Colors.BOLD}📊 RÉSUMÉ DES TESTS{Colors.END}")
        print(f"{Colors.BOLD}{'='*60}{Colors.END}\n")
        
        total = len(self.test_results)
        passed = sum(1 for t in self.test_results if t["success"])
        failed = total - passed
        success_rate = (passed / total * 100) if total > 0 else 0
        
        print(f"Total tests: {total}")
        print(f"{Colors.GREEN}Tests réussis: {passed}{Colors.END}")
        print(f"{Colors.RED}Tests échoués: {failed}{Colors.END}")
        print(f"Taux de réussite: {success_rate:.1f}%\n")
        
        if failed > 0:
            print(f"{Colors.RED}{Colors.BOLD}Tests échoués:{Colors.END}")
            for test in self.test_results:
                if not test["success"]:
                    print(f"  • {test['name']}")
                    if test["message"]:
                        print(f"    {test['message']}")
    
    async def run_all_tests(self):
        """Exécuter tous les tests"""
        print(f"\n{Colors.BLUE}{Colors.BOLD}")
        print("╔══════════════════════════════════════════════════════════╗")
        print("║     🧪 CAR RENTAL API - TEST & DEBUG SUITE             ║")
        print("╚══════════════════════════════════════════════════════════╝")
        print(f"{Colors.END}\n")
        
        await self.run_auth_tests()
        await self.run_agency_tests()
        await self.run_vehicle_tests()
        await self.run_customer_tests()
        await self.run_booking_tests()
        await self.run_contract_tests()
        await self.run_payment_tests()
        
        self.print_summary()


async def main():
    """Fonction principale"""
    tester = APITester()
    await tester.run_all_tests()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Test interrompu par l'utilisateur{Colors.END}")
        sys.exit(0)
    except Exception as e:
        print(f"\n{Colors.RED}Erreur fatale: {str(e)}{Colors.END}")
        sys.exit(1)
