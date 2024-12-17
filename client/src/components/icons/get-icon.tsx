import Back from './back';
import Category from './category';
import Dashboard from './dashboard';
import Dollar from './dollar';
import Ledger from './ledger';
import Logout from './logout';
import Menu from './menu';
import Money from './money';
import Organization from './organization';
import Person from './person';
import Plus from './plus';
import Settings from './settings';
import Today from './today';

export type iconKeys =
	| 'dashboard'
	| 'person'
	| 'money'
	| 'category'
	| 'logout'
	| 'plus'
	| 'back'
	| 'organization'
	| 'settings'
	| 'ledger'
	| 'dollar'
	| 'today'
	| 'menu';

type GetIconProps = {
	iconKey: iconKeys;
};

export default function GetIcon({ iconKey }: GetIconProps) {
	const icons = new Map();
	icons.set('dashboard', <Dashboard />);
	icons.set('person', <Person />);
	icons.set('money', <Money />);
	icons.set('money', <Money />);
	icons.set('category', <Category />);
	icons.set('logout', <Logout />);
	icons.set('back', <Back />);
	icons.set('plus', <Plus />);
	icons.set('organization', <Organization />);
	icons.set('settings', <Settings />);
	icons.set('ledger', <Ledger />);
	icons.set('dollar', <Dollar />);
	icons.set('today', <Today />);
	icons.set('menu', <Menu />);

	return icons.get(iconKey);
}
