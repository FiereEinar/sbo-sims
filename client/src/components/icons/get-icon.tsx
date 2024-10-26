import Back from './back';
import Category from './category';
import Dashboard from './dashboard';
import Logout from './logout';
import Money from './money';
import Organization from './organization';
import Person from './person';
import Plus from './plus';
import Settings from './settings';

export type iconKeys =
	| 'dashboard'
	| 'person'
	| 'money'
	| 'category'
	| 'logout'
	| 'plus'
	| 'back'
	| 'organization'
	| 'settings';

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

	return icons.get(iconKey);
}
