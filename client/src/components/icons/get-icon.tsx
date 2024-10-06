import Category from './category';
import Dashboard from './dashboard';
import Logout from './logout';
import Money from './money';
import Person from './person';

export type iconKeys = 'dashboard' | 'person' | 'money' | 'category' | 'logout';

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

	return icons.get(iconKey);
}
